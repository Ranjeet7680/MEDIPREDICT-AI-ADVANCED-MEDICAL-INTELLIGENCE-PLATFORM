from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from app.core.exceptions import AISafetyException
from app.services.ai.safety import AISafetyLayer

class BaseAgent(ABC):
    def __init__(self, name: str, role: str):
        self.name = name
        self.role = role

    def check_safety(self, text: str) -> None:
        """Enforce strict non-emergency & non-diagnostic constraints."""
        is_emergency, emergency_msg, _ = AISafetyLayer.inspect_query(text)
        if is_emergency:
            raise AISafetyException(emergency_msg)

    @abstractmethod
    async def run(self, task: str, context: Optional[Dict[str, Any]] = None, db: Optional[Session] = None) -> Dict[str, Any]:
        """Execute agent workflow."""
        pass
