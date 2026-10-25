import datetime
import uuid
from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user
from app.core.exceptions import NotFoundException
from app.db.session import get_db
from app.models.models import AgentRun, User
from app.schemas.schemas import AgentRunRequest, AgentRunResponse
from app.services.agents.device_agent import DeviceIntegrationAgent
from app.services.agents.health_monitor_agent import HealthMonitoringAgent
from app.services.agents.medical_info_agent import MedicalInformationAgent
from app.services.agents.report_agent import MedicalReportAgent
from app.services.agents.research_agent import ResearchAgent
from app.services.agents.supervisor import AgentSupervisor
from app.services.agents.workflow_agent import HealthcareWorkflowAgent

router = APIRouter(prefix="/agents", tags=["AI Agents"])

AGENT_REGISTRY = {
    "supervisor": AgentSupervisor(),
    "medical_information": MedicalInformationAgent(),
    "medical_report": MedicalReportAgent(),
    "health_monitoring": HealthMonitoringAgent(),
    "research": ResearchAgent(),
    "device_integration": DeviceIntegrationAgent(),
    "healthcare_workflow": HealthcareWorkflowAgent(),
}

@router.post("/run", response_model=AgentRunResponse, status_code=status.HTTP_201_CREATED)
async def run_agent(
    payload: AgentRunRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    agent_key = payload.agent_type.lower()
    agent = AGENT_REGISTRY.get(agent_key, AGENT_REGISTRY["supervisor"])

    context = payload.context or {}
    context["user_id"] = current_user.id

    started_at = datetime.datetime.utcnow()
    run_id = f"run_{uuid.uuid4().hex[:12]}"

    # Execute agent workflow
    result = await agent.run(payload.task_description, context=context, db=db)

    human_review_required = result.get("human_review_required", False)
    human_notes = result.get("recommendation") if human_review_required else None

    # Persist in database
    run_record = AgentRun(
        id=run_id,
        user_id=current_user.id,
        agent_type=payload.agent_type,
        task_description=payload.task_description,
        status="completed",
        result=result,
        tool_calls=[{"agent": result.get("agent", agent_key), "action": "execute"}],
        human_review_required=human_review_required,
        human_review_notes=human_notes,
        started_at=started_at,
        completed_at=datetime.datetime.utcnow(),
    )
    db.add(run_record)
    db.commit()
    db.refresh(run_record)

    return run_record

@router.get("/runs", response_model=List[AgentRunResponse])
def list_agent_runs(
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    runs = (
        db.query(AgentRun)
        .filter(AgentRun.user_id == current_user.id)
        .order_by(AgentRun.started_at.desc())
        .limit(limit)
        .all()
    )
    return runs

@router.get("/runs/{run_id}", response_model=AgentRunResponse)
def get_agent_run(
    run_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    run_record = (
        db.query(AgentRun)
        .filter(AgentRun.id == run_id, AgentRun.user_id == current_user.id)
        .first()
    )
    if not run_record:
        raise NotFoundException("Agent run not found")
    return run_record
