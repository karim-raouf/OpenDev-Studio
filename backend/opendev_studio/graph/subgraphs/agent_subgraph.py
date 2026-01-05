"""
Agent Subgraph - Full autonomous agent with all tools.
Handles complex, multi-step tasks with planning and execution.
"""

import operator
from typing import TypedDict, Annotated, Sequence
from langchain_core.messages import BaseMessage, HumanMessage
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode

from components.tools import registry
from components.agent_factory import get_agentic_agent


# --- 1. Define the Tools ---
tool_node = ToolNode(registry.get_tools(scope="Agent"))


# --- 2. Define the Graph State ---
class AgentModeState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    provider: str


# --- 3. Define the Nodes ---
def call_model(state: AgentModeState):
    print("---[AGENT] CALLING MODEL---")
    messages = state['messages']
    provider = state.get('provider', 'azure')
    agent = get_agentic_agent(provider)
    response = agent.invoke({"messages": messages})
    return {"messages": [response]}


def call_tools(state: AgentModeState):
    print("---[AGENT] EXECUTING TOOLS---")
    return tool_node.invoke(state)


# --- 4. Define the Conditional Edges ---
def should_continue(state: AgentModeState):
    last_message = state['messages'][-1]
    if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
        print("---[AGENT] TOOLS NEEDED---")
        return "call_tools"
    else:
        print("---[AGENT] NO TOOLS NEEDED, ENDING---")
        return "end"


# --- 5. Build the Graph ---
workflow = StateGraph(AgentModeState)

workflow.add_node("call_model", call_model)
workflow.add_node("call_tools", call_tools)

workflow.set_entry_point("call_model")

workflow.add_conditional_edges(
    "call_model",
    should_continue,
    {
        "call_tools": "call_tools",
        "end": END
    }
)

workflow.add_edge("call_tools", "call_model")

# Compile the graph - exported as 'agentic_subgraph' for compatibility
agentic_subgraph = workflow.compile()
