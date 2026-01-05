"""
Planner Agent Response Models

Defines the structured output schema for the Planner Agent,
which creates execution plans with typed steps.
"""

from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class PlanStep(BaseModel):
    """A single step in the execution plan."""
    
    step_number: int = Field(
        description="The sequential order of this step (1, 2, 3...)"
    )
    description: str = Field(
        description="A clear description of what this step accomplishes"
    )
    mode: Literal["ask", "edit", "agent"] = Field(
        description="The execution mode for this step: 'ask' for read-only queries, 'edit' for file modifications, 'agent' for complex multi-step tasks"
    )
    instruction: str = Field(
        description="The specific instruction to pass to the subgraph for execution"
    )


class PlannerResponse(BaseModel):
    """Structured response from the Planner Agent."""
    
    thinking: str = Field(
        description="The planner's reasoning about the task and approach"
    )
    plan: List[PlanStep] = Field(
        default_factory=list,
        description="The list of steps to execute. Empty if the task can be answered directly."
    )
    direct_response: Optional[str] = Field(
        default=None,
        description="A direct response if no plan is needed (e.g., simple questions)"
    )
    requires_planning: bool = Field(
        description="True if the task requires a multi-step plan, False for direct responses"
    )
