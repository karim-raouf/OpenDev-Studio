import os
from typing import Optional

# --- Factory Functions (Lazy Initialization) ---
# These functions create LLM instances only when called, avoiding errors from missing credentials.

def get_azure_llm():
    """Factory for Azure OpenAI LLM."""
    from langchain_openai import AzureChatOpenAI
    return AzureChatOpenAI(
        azure_deployment=os.getenv("LARGE_AZURE_OPENAI_DEPLOYMENT_NAME"),
        openai_api_version=os.getenv("LARGE_AZURE_OPENAI_API_VERSION"),
        azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
        api_key=os.getenv("AZURE_OPENAI_API_KEY"),
        temperature=1,
        max_retries=2,
        request_timeout=15
    )

def get_groq_llm():
    """Factory for Groq LLM."""
    from langchain_groq import ChatGroq
    return ChatGroq(
        model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.2
    )

def get_openrouter_llm():
    """Factory for OpenRouter LLM."""
    from langchain_openai import ChatOpenAI
    return ChatOpenAI(
        model=os.getenv("OPENROUTER_MODEL", "kwaipilot/kat-coder-pro:free"),
        api_key=os.getenv("OPENROUTER_API_KEY"),
        base_url="https://openrouter.ai/api/v1",
        temperature=0.2,
    )

def get_gemini_llm():
    """Factory for Google Gemini LLM."""
    from langchain_google_genai import ChatGoogleGenerativeAI
    return ChatGoogleGenerativeAI(
        model=os.getenv("GEMINI_MODEL", "gemini-2.0-flash-lite"),
        google_api_key=os.getenv("GOOGLE_API_KEY"),
        temperature=0.2
    )

def get_openai_llm():
    """Factory for OpenAI LLM."""
    from langchain_openai import ChatOpenAI
    return ChatOpenAI(
        model=os.getenv("OPENAI_MODEL", "gpt-4o"),
        api_key=os.getenv("OPENAI_API_KEY"),
        base_url="https://api.openai.com/v1",
        temperature=0.2,
    )

def get_ollama_local_llm():
    """Factory for local Ollama LLM."""
    from langchain_ollama import ChatOllama
    return ChatOllama(
        model=os.getenv("OLLAMA_MODEL", "llama3"),
        base_url="http://localhost:11434",
        temperature=0.2
    )

def get_ollama_cloud_llm():
    """Factory for cloud-hosted Ollama LLM."""
    from langchain_ollama import ChatOllama
    return ChatOllama(
        model=os.getenv("OLLAMA_MODEL", "llama3"),
        base_url=os.getenv("OLLAMA_CLOUD_URL", "https://ollama.example.com"),
        temperature=0.2
    )


# --- Provider Registry ---
# Maps provider names to their factory functions (NOT instances)
providers = {
    "azure": get_azure_llm,
    "openai": get_openai_llm,
    "gemini": get_gemini_llm,
    "groq": get_groq_llm,
    "ollama_local": get_ollama_local_llm,
    "ollama_cloud": get_ollama_cloud_llm,
    "openrouter": get_openrouter_llm,
}


# --- LLM Instance Cache ---
# Stores initialized LLM instances to avoid re-creating them
_llm_cache: dict = {}


def get_llm(provider_name: str):
    """
    Gets the LLM instance for the specified provider.
    Uses caching to avoid re-initializing the same provider multiple times.
    
    Args:
        provider_name: The name of the provider (e.g., 'azure', 'groq', 'gemini').
        
    Returns:
        The LLM instance for the specified provider.
        
    Raises:
        ValueError: If the provider name is not recognized.
        RuntimeError: If initialization fails (e.g., missing credentials).
    """
    # Return cached instance if available
    if provider_name in _llm_cache:
        return _llm_cache[provider_name]
    
    # Validate provider name
    if provider_name not in providers:
        available = ", ".join(providers.keys())
        raise ValueError(f"Unknown provider: '{provider_name}'. Available providers: {available}")
    
    # Initialize the LLM
    try:
        llm_instance = providers[provider_name]()
        _llm_cache[provider_name] = llm_instance
        return llm_instance
    except Exception as e:
        raise RuntimeError(
            f"Failed to initialize '{provider_name}' LLM. "
            f"Please check that the required environment variables are set. Error: {e}"
        )


def get_available_providers() -> list[str]:
    """Returns a list of all available provider names."""
    return list(providers.keys())
