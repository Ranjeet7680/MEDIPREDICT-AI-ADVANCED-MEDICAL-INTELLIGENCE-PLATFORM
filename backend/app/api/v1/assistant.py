from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.v1.deps import get_current_user
from app.core.config import settings
from app.core.exceptions import ForbiddenException, NotFoundException
from app.db.session import get_db
from app.models.models import Conversation, MedicalReport, Message, User
from app.schemas.schemas import (
    ConversationCreate,
    ConversationDetailResponse,
    ConversationResponse,
    MessageCreate,
    MessageResponse,
    ProviderStatusResponse,
)
from app.services.ai.factory import AIProviderFactory
from app.services.audit.audit_service import AuditService
from app.services.medical_rag.retrieval_service import MedicalRAGService

router = APIRouter(prefix="/assistant", tags=["Medical Assistant"])

@router.get("/providers", response_model=ProviderStatusResponse)
def get_providers():
    return {
        "current_provider": settings.AI_PROVIDER,
        "providers": AIProviderFactory.get_all_provider_status(),
    }

@router.get("/conversations", response_model=List[ConversationResponse])
def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    convs = (
        db.query(Conversation)
        .filter(Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
        .all()
    )
    result = []
    for c in convs:
        last_msg = (
            db.query(Message)
            .filter(Message.conversation_id == c.id)
            .order_by(Message.created_at.desc())
            .first()
        )
        res_item = ConversationResponse.model_validate(c)
        res_item.last_message = last_msg.content[:80] + "..." if last_msg else None
        result.append(res_item)
    return result

@router.post("/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
def create_conversation(
    conv_in: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = Conversation(
        user_id=current_user.id,
        title=conv_in.title or "New Medical Consultation",
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)

    # Add initial greeting message
    greeting = Message(
        conversation_id=conv.id,
        role="assistant",
        content=(
            "Hello! I am MediPredict AI, your clinical intelligence and medical information assistant. "
            "I can explain laboratory measurements, reference guidelines, and research papers.\n\n"
            "How can I assist your health and medical inquiry today?"
        ),
        sources=[],
    )
    db.add(greeting)
    db.commit()

    return conv

@router.get("/conversations/{conversation_id}", response_model=ConversationDetailResponse)
def get_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise NotFoundException("Conversation not found")
    if conv.user_id != current_user.id:
        raise ForbiddenException()

    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .all()
    )
    res = ConversationDetailResponse.model_validate(conv)
    res.messages = [MessageResponse.model_validate(m) for m in messages]
    return res

@router.delete("/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise NotFoundException("Conversation not found")
    if conv.user_id != current_user.id:
        raise ForbiddenException()

    db.delete(conv)
    db.commit()
    return {"message": "Conversation deleted"}

@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse)
async def send_message(
    conversation_id: int,
    msg_in: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise NotFoundException("Conversation not found")
    if conv.user_id != current_user.id:
        raise ForbiddenException()

    # 1. Save user message
    user_msg = Message(
        conversation_id=conv.id,
        role="user",
        content=msg_in.content,
    )
    db.add(user_msg)
    db.commit()

    # If first non-greeting message, update conversation title
    msg_count = db.query(Message).filter(Message.conversation_id == conv.id).count()
    if msg_count <= 2:
        conv.title = msg_in.content[:40] + ("..." if len(msg_in.content) > 40 else "")
        db.commit()

    # 2. Check for attached medical report context
    report_data = None
    if msg_in.report_attachment_id:
        report = db.query(MedicalReport).filter(MedicalReport.id == msg_in.report_attachment_id).first()
        if report and report.user_id == current_user.id:
            report_data = {
                "title": report.title,
                "measurements": [
                    {
                        "test_name": m.test_name,
                        "value": m.value,
                        "unit": m.unit,
                        "flag": m.flag,
                        "reference_text": m.reference_text,
                    }
                    for m in report.measurements
                ],
            }

    # 3. Retrieve Evidence Context via Medical RAG
    retrieved_evidence = MedicalRAGService.retrieve_evidence(db, msg_in.content, limit=3)

    # 4. Query AI Provider
    provider = AIProviderFactory.get_provider(msg_in.provider)
    chat_history = [
        {"role": m.role, "content": m.content}
        for m in db.query(Message).filter(Message.conversation_id == conv.id).order_by(Message.created_at.asc()).all()
    ]

    ai_result = await provider.generate_response(
        messages=chat_history,
        retrieved_context=retrieved_evidence,
        report_data=report_data,
    )

    # 5. Save assistant response
    assistant_msg = Message(
        conversation_id=conv.id,
        role="assistant",
        content=ai_result["content"],
        sources=ai_result.get("sources", []),
        safety_alerts=ai_result.get("safety_alerts", []),
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    AuditService.log_event(
        db,
        action="AI_QUERY",
        user_id=current_user.id,
        resource_type="Message",
        resource_id=str(assistant_msg.id),
        details={"provider": ai_result.get("provider"), "model": ai_result.get("model")},
    )

    return assistant_msg
