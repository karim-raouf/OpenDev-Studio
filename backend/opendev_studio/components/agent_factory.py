"""
Agent Factory Module

This module provides factory functions for creating and caching agent instances
with different LLM providers. Each agent type/provider combination is cached
to avoid recreating expensive objects.
"""

from components.ai_models import get_llm
from components.agents.planner_agent import PlannerResponse
from components.tools import registry

# Cache for agent instances
# Format: {agent_type}_{provider} -> agent_instance
_agent_cache = {}


def get_planner_agent(provider: str):
    """
    Get or create a planner agent for the specified provider.
    
    Args:
        provider: Name of the LLM provider (e.g., 'azure', 'groq', 'gemini')
        
    Returns:
        A configured planner agent with structured output and tools
    """
    cache_key = f"planner_{provider}"
    
    if cache_key not in _agent_cache:
        llm = get_llm(provider)
        planner_tools = registry.get_tools(scope="Planner")
        _agent_cache[cache_key] = llm.bind_tools(planner_tools).with_structured_output(PlannerResponse)
    
    return _agent_cache[cache_key]


def get_ask_agent(provider: str):
    """
    Get or create an ask agent for the specified provider.
    
    Args:
        provider: Name of the LLM provider (e.g., 'azure', 'groq', 'gemini')
        
    Returns:
        A configured ask agent with tools bound
    """
    cache_key = f"ask_{provider}"
    
    if cache_key not in _agent_cache:
        llm = get_llm(provider)
        ask_tools = registry.get_tools(scope="Ask")
        _agent_cache[cache_key] = llm.bind_tools(ask_tools)
    
    return _agent_cache[cache_key]


def get_edit_agent(provider: str):
    """
    Get or create an edit agent for the specified provider.
    
    Args:
        provider: Name of the LLM provider (e.g., 'azure', 'groq', 'gemini')
        
    Returns:
        A configured edit agent with tools bound
    """
    cache_key = f"edit_{provider}"
    
    if cache_key not in _agent_cache:
        llm = get_llm(provider)
        edit_tools = registry.get_tools(scope="Edit")
        _agent_cache[cache_key] = llm.bind_tools(edit_tools)
    
    return _agent_cache[cache_key]


def get_agentic_agent(provider: str):
    """
    Get or create a full agentic agent for the specified provider.
    
    Args:
        provider: Name of the LLM provider (e.g., 'azure', 'groq', 'gemini')
        
    Returns:
        A configured agentic agent with full toolset
    """
    cache_key = f"agentic_{provider}"
    
    if cache_key not in _agent_cache:
        llm = get_llm(provider)
        agentic_tools = registry.get_tools(scope="Agent")
        _agent_cache[cache_key] = llm.bind_tools(agentic_tools)
    
    return _agent_cache[cache_key]


def clear_agent_cache():
    """Clear the agent cache. Useful for testing or when switching providers."""
    _agent_cache.clear()


def get_cached_agents() -> dict:
    """
    Get information about currently cached agents.
    
    Returns:
        Dictionary with cache statistics
    """
    return {
        "cached_count": len(_agent_cache),
        "cached_agents": list(_agent_cache.keys())
    }
