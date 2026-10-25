from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

class BaseAIProvider(ABC):
    @abstractmethod
    def name(self) -> str:
        pass

    @abstractmethod
    def is_configured(self) -> bool:
        pass

    @abstractmethod
    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        retrieved_context: Optional[List[Dict[str, Any]]] = None,
        report_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Returns {
            'content': str,
            'sources': List[Dict[str, Any]],
            'safety_alerts': List[str],
            'provider': str,
            'model': str
        }
        """
        pass

    @abstractmethod
    async def interpret_report(
        self,
        report_title: str,
        measurements: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Returns {
            'summary': str,
            'interpretation': str,
            'key_findings': List[str],
            'abnormalities': List[str]
        }
        """
        pass
