"""
Engineering Graph - Main Orchestration Layer

This is the top-level graph that:
1. Receives user requests
2. Uses a Planner to create a step-by-step execution plan
3. Executes each step using the appropriate subgraph (Ask, Edit, Agent)
4. Collects results and returns a final response
"""

import operator
from typing import TypedDict, Annotated, Sequence, List, Optional, Literal
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langgraph.graph import StateGraph, END

from components.agent_factory import get_planner_agent
from components.agents.planner_agent import PlanStep, PlannerResponse
from graph.subgraphs.ask_subgraph import ask_subgraph
from graph.subgraphs.edit_subgraph import edit_subgraph
from graph.subgraphs.agent_subgraph import agentic_subgraph


# --- 1. Define the Main Graph State ---
class EngineeringState(TypedDict):
    """State for the main engineering graph."""
    
    # Message history
    messages: Annotated[Sequence[BaseMessage], operator.add]
    
    # LLM provider selection
    provider: str
    
    # Planning state
    plan: List[PlanStep]
    current_step_index: int
    
    # Execution state
    step_results: List[str]
    
    # Final output
    final_response: Optional[str]
    
    # Status tracking
    status: Literal["planning", "executing", "completed", "error"]


# --- 2. Define the Planner Node ---
PLANNER_SYSTEM_PROMPT = """You are a Software Engineering Planner Agent. Your role is to analyze user requests and create detailed execution plans.

For each request, determine if it requires multiple steps or can be answered directly:

1. **Direct Response**: For simple questions or clarifications that don't require file operations, set `requires_planning=False` and provide a `direct_response`.

2. **Multi-Step Plan**: For tasks requiring file operations, code changes, or complex analysis:
   - Break down the task into clear, sequential steps
   - Assign each step the appropriate mode:
     - `ask`: For reading files, exploring project structure, understanding code (read-only)
     - `edit`: For modifying files, creating new files, or deleting files
     - `agent`: For complex tasks requiring multiple operations or autonomous decision-making
   - Provide clear instructions for each step

Think carefully about the order of operations and dependencies between steps.
"""


def planner_node(state: EngineeringState) -> dict:
    """Creates an execution plan from the user's request."""
    print("---[PLANNER] ANALYZING REQUEST---")
    
    messages = state["messages"]
    provider = state.get("provider", "azure")
    
    # Get the planner agent with structured output
    planner = get_planner_agent(provider)
    
    # Prepare messages with system prompt
    planning_messages = [
        SystemMessage(content=PLANNER_SYSTEM_PROMPT),
        *messages
    ]
    
    # Get the structured plan
    response: PlannerResponse = planner.invoke(planning_messages)
    
    print(f"---[PLANNER] THINKING: {response.thinking[:100]}...---")
    print(f"---[PLANNER] REQUIRES PLANNING: {response.requires_planning}---")
    
    if response.requires_planning:
        print(f"---[PLANNER] CREATED {len(response.plan)} STEPS---")
        for step in response.plan:
            print(f"  Step {step.step_number}: [{step.mode.upper()}] {step.description}")
        
        return {
            "plan": response.plan,
            "current_step_index": 0,
            "step_results": [],
            "status": "executing",
            "messages": [AIMessage(content=f"📋 **Plan Created**\n\n{response.thinking}\n\nExecuting {len(response.plan)} steps...")]
        }
    else:
        print("---[PLANNER] DIRECT RESPONSE (NO PLAN NEEDED)---")
        return {
            "plan": [],
            "current_step_index": 0,
            "step_results": [],
            "final_response": response.direct_response,
            "status": "completed",
            "messages": [AIMessage(content=response.direct_response)]
        }


# --- 3. Define the Step Executor Node ---
def execute_step_node(state: EngineeringState) -> dict:
    """Executes the current step using the appropriate subgraph."""
    
    plan = state["plan"]
    current_index = state["current_step_index"]
    provider = state.get("provider", "azure")
    step_results = list(state.get("step_results", []))
    
    if current_index >= len(plan):
        print("---[EXECUTOR] ALL STEPS COMPLETED---")
        return {"status": "completed"}
    
    current_step = plan[current_index]
    print(f"---[EXECUTOR] RUNNING STEP {current_step.step_number}: {current_step.mode.upper()}---")
    print(f"---[EXECUTOR] INSTRUCTION: {current_step.instruction}---")
    
    # Prepare the message for the subgraph
    step_message = HumanMessage(content=current_step.instruction)
    subgraph_state = {
        "messages": [step_message],
        "provider": provider
    }
    
    # Select and invoke the appropriate subgraph
    try:
        if current_step.mode == "ask":
            result = ask_subgraph.invoke(subgraph_state)
        elif current_step.mode == "edit":
            result = edit_subgraph.invoke(subgraph_state)
        elif current_step.mode == "agent":
            result = agentic_subgraph.invoke(subgraph_state)
        else:
            raise ValueError(f"Unknown mode: {current_step.mode}")
        
        # Extract the final response from the subgraph
        result_messages = result.get("messages", [])
        if result_messages:
            last_message = result_messages[-1]
            result_content = last_message.content if hasattr(last_message, "content") else str(last_message)
        else:
            result_content = "Step completed (no output)"
        
        step_results.append(f"**Step {current_step.step_number}** ({current_step.mode}): {result_content}")
        print(f"---[EXECUTOR] STEP {current_step.step_number} COMPLETED---")
        
    except Exception as e:
        error_msg = f"Error in step {current_step.step_number}: {str(e)}"
        step_results.append(error_msg)
        print(f"---[EXECUTOR] STEP {current_step.step_number} FAILED: {e}---")
    
    return {
        "current_step_index": current_index + 1,
        "step_results": step_results,
        "messages": [AIMessage(content=f"✅ Completed Step {current_step.step_number}: {current_step.description}")]
    }


# --- 4. Define the Finalizer Node ---
def finalizer_node(state: EngineeringState) -> dict:
    """Compiles all step results into a final response."""
    print("---[FINALIZER] COMPILING RESULTS---")
    
    step_results = state.get("step_results", [])
    plan = state.get("plan", [])
    
    if not step_results:
        final_response = "Task completed with no output."
    else:
        # Format the final response
        results_text = "\n\n".join(step_results)
        final_response = f"## Execution Complete\n\nCompleted {len(plan)} steps:\n\n{results_text}"
    
    return {
        "final_response": final_response,
        "status": "completed",
        "messages": [AIMessage(content=final_response)]
    }


# --- 5. Define Conditional Edges ---
def should_continue_planning(state: EngineeringState) -> str:
    """Determines the next step after planning."""
    status = state.get("status", "planning")
    plan = state.get("plan", [])
    
    if status == "completed":
        # Direct response was given, no execution needed
        return "end"
    elif plan:
        # We have a plan to execute
        return "execute"
    else:
        # No plan and not completed - error state
        return "end"


def should_continue_execution(state: EngineeringState) -> str:
    """Determines if we should continue executing steps or finalize."""
    current_index = state.get("current_step_index", 0)
    plan = state.get("plan", [])
    
    if current_index < len(plan):
        # More steps to execute
        return "continue"
    else:
        # All steps done, finalize
        return "finalize"


# --- 6. Build the Graph ---
def build_engineering_graph():
    """Constructs and returns the main engineering graph."""
    
    workflow = StateGraph(EngineeringState)
    
    # Add nodes
    workflow.add_node("planner", planner_node)
    workflow.add_node("executor", execute_step_node)
    workflow.add_node("finalizer", finalizer_node)
    
    # Set entry point
    workflow.set_entry_point("planner")
    
    # Add conditional edges from planner
    workflow.add_conditional_edges(
        "planner",
        should_continue_planning,
        {
            "execute": "executor",
            "end": END
        }
    )
    
    # Add conditional edges from executor
    workflow.add_conditional_edges(
        "executor",
        should_continue_execution,
        {
            "continue": "executor",
            "finalize": "finalizer"
        }
    )
    
    # Finalizer always ends
    workflow.add_edge("finalizer", END)
    
    return workflow.compile()


# Create the compiled graph instance
engineering_graph = build_engineering_graph()


# --- 7. Convenience Functions ---
def run_engineering_task(user_request: str, provider: str = "azure") -> dict:
    """
    Execute an engineering task from a user request.
    
    Args:
        user_request: The user's natural language request
        provider: The LLM provider to use (default: 'azure')
    
    Returns:
        The final state containing all results
    """
    initial_state = {
        "messages": [HumanMessage(content=user_request)],
        "provider": provider,
        "plan": [],
        "current_step_index": 0,
        "step_results": [],
        "final_response": None,
        "status": "planning"
    }
    
    return engineering_graph.invoke(initial_state)


async def arun_engineering_task(user_request: str, provider: str = "azure") -> dict:
    """
    Async version of run_engineering_task.
    
    Args:
        user_request: The user's natural language request
        provider: The LLM provider to use (default: 'azure')
    
    Returns:
        The final state containing all results
    """
    initial_state = {
        "messages": [HumanMessage(content=user_request)],
        "provider": provider,
        "plan": [],
        "current_step_index": 0,
        "step_results": [],
        "final_response": None,
        "status": "planning"
    }
    
    return await engineering_graph.ainvoke(initial_state)


async def stream_engineering_task(user_request: str, provider: str = "azure"):
    """
    Stream the engineering task execution for real-time updates.
    
    Args:
        user_request: The user's natural language request
        provider: The LLM provider to use (default: 'azure')
    
    Yields:
        State updates as the graph executes
    """
    initial_state = {
        "messages": [HumanMessage(content=user_request)],
        "provider": provider,
        "plan": [],
        "current_step_index": 0,
        "step_results": [],
        "final_response": None,
        "status": "planning"
    }
    
    async for event in engineering_graph.astream(initial_state):
        yield event
