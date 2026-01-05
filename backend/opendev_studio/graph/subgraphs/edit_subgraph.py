"""
Edit Subgraph - Placeholder for edit mode operations.
TODO: Implement similar to ask_subgraph with edit-specific tools.
"""

import operator
from typing import TypedDict, Annotated, Sequence
from langchain_core.messages import BaseMessage, HumanMessage
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode

from components.tools import registry
from components.agent_factory import get_edit_agent


# --- 1. Define the Tools ---
tool_node = ToolNode(registry.get_tools(scope="Edit"))


# --- 2. Define the Graph State ---
class EditState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    provider: str


# --- 3. Define the Nodes ---
def call_model(state: EditState):
    print("---[EDIT] CALLING MODEL---")
    messages = state['messages']
    provider = state.get('provider', 'azure')
    edit_agent = get_edit_agent(provider)
    response = edit_agent.invoke({"messages": messages})
    return {"messages": [response]}


def call_tools(state: EditState):
    print("---[EDIT] EXECUTING TOOLS---")
    return tool_node.invoke(state)


# --- 4. Define the Conditional Edges ---
def should_continue(state: EditState):
    last_message = state['messages'][-1]
    if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
        print("---[EDIT] TOOLS NEEDED---")
        return "call_tools"
    else:
        print("---[EDIT] NO TOOLS NEEDED, ENDING---")
        return "end"


# --- 5. Build the Graph ---
workflow = StateGraph(EditState)

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

# Compile the graph
edit_subgraph = workflow.compile()
