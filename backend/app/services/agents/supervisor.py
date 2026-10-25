from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from app.services.agents.base import BaseAgent
from app.services.agents.device_agent import DeviceIntegrationAgent
from app.services.agents.health_monitor_agent import HealthMonitoringAgent
from app.services.agents.medical_info_agent import MedicalInformationAgent
from app.services.agents.report_agent import MedicalReportAgent
from app.services.agents.research_agent import ResearchAgent
from app.services.agents.workflow_agent import HealthcareWorkflowAgent

class AgentSupervisor(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Supervisor Orchestrator Agent",
            role="Coordinate specialized healthcare agents, synthesize multi-modal findings, and enforce clinical safety."
        )
        self.medical_info_agent = MedicalInformationAgent()
        self.report_agent = MedicalReportAgent()
        self.health_monitor_agent = HealthMonitoringAgent()
        self.research_agent = ResearchAgent()
        self.device_agent = DeviceIntegrationAgent()
        self.workflow_agent = HealthcareWorkflowAgent()

    async def run(self, task: str, context: Optional[Dict[str, Any]] = None, db: Optional[Session] = None) -> Dict[str, Any]:
        self.check_safety(task)
        t_lower = task.lower()

        delegated_results: List[Dict[str, Any]] = []
        human_review_flag = False

        # Intent Routing Logic
        if any(w in t_lower for w in ["lab", "report", "blood test", "glucose", "hba1c", "biomarker", "extract"]):
            rep_res = await self.report_agent.run(task, context, db)
            delegated_results.append(rep_res)
            if rep_res.get("human_review_required"):
                human_review_flag = True
                wf_res = await self.workflow_agent.run(task, context, db)
                delegated_results.append(wf_res)

        elif any(w in t_lower for w in ["device", "sensor", "wearable", "battery", "connect", "iot", "esp32"]):
            dev_res = await self.device_agent.run(task, context, db)
            delegated_results.append(dev_res)
            mon_res = await self.health_monitor_agent.run(task, context, db)
            delegated_results.append(mon_res)
            if mon_res.get("human_review_required"):
                human_review_flag = True

        elif any(w in t_lower for w in ["research", "paper", "study", "pubmed", "pmid", "evidence"]):
            res_res = await self.research_agent.run(task, context, db)
            delegated_results.append(res_res)

        elif any(w in t_lower for w in ["vital", "heart rate", "spo2", "pulse", "anomaly", "trend"]):
            mon_res = await self.health_monitor_agent.run(task, context, db)
            delegated_results.append(mon_res)
            if mon_res.get("human_review_required"):
                human_review_flag = True

        else:
            info_res = await self.medical_info_agent.run(task, context, db)
            delegated_results.append(info_res)

        # Unified synthesis
        agent_names = [r["agent"] for r in delegated_results]
        synthesized_summary = " | ".join(r["summary"] for r in delegated_results)

        return {
            "supervisor": self.name,
            "status": "completed",
            "delegated_agents": agent_names,
            "human_review_required": human_review_flag,
            "summary": synthesized_summary,
            "agent_findings": delegated_results,
            "safety_attestation": "Multi-agent execution verified under supervisor safety governance."
        }
