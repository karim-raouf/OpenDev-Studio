import os
import operator
from typing import TypedDict, Annotated, Sequence
from langchain_core.messages import BaseMessage, HumanMessage, ToolMessage
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode

from components.tools import registry
from components.agent_factory import get_ask_agent

# --- 1. Define the Tools ---
tool_node = ToolNode(registry.get_tools(scope="Ask"))


# --- 2. Define the Graph State ---
class AskState(TypedDict):

    messages: Annotated[Sequence[BaseMessage], operator.add]
    provider: str  # Added to support dynamic LLM selection


# --- 3. Define the Nodes ---
def call_model(state: AskState):
    print("---CALLING MODEL---")
    messages = state['messages']
    
    # Get provider from state (with fallback to default)
    provider = state.get('provider', 'azure')
    ask_agent = get_ask_agent(provider)
    
    response = ask_agent.invoke(messages)

    return {"messages": [response]}

def call_tools(state: AskState):
    """
    This function now delegates to ToolNode which handles tool execution automatically
    """
    print("---EXECUTING TOOLS---")
    # ToolNode handles all the tool execution logic
    return tool_node.invoke(state)

# --- 4. Define the Conditional Edges ---
def should_continue(state: AskState):
    """
    Decide whether to continue to tools or end
    """
    last_message = state['messages'][-1]
    
    # Check if the last message has tool calls
    if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
        print("---TOOLS NEEDED---")
        return "call_tools"
    else:
        print("---NO TOOLS NEEDED, ENDING---")
        return "end"


# --- 5. Build the Graph ---
workflow = StateGraph(AskState)

# Add nodes
workflow.add_node("call_model", call_model)
workflow.add_node("call_tools", call_tools)


# Set entry point
workflow.set_entry_point("call_model")

# Add conditional edges
workflow.add_conditional_edges(
    "call_model",
    should_continue,
    {
        "call_tools": "call_tools",
        "end": END                 
    }
)

# Add edge from tools back to model
workflow.add_edge("call_tools", "call_model")

# Compile the graph
ask_subgraph = workflow.compile()