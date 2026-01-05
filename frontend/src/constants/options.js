// Provider and mode options for the application

export const PROVIDER_OPTIONS = [
    { value: "groq", label: "Groq" },
    { value: "openai", label: "OpenAI" },
    { value: "anthropic", label: "Anthropic" },
    { value: "google", label: "Google" },
    { value: "azure", label: "Azure" },
    { value: "ollama_local", label: "Ollama (local)" },
    { value: "ollama_cloud", label: "Ollama (cloud)" },
    { value: "openrouter", label: "OpenRouter" }
];

export const MODE_OPTIONS = [
    { value: "Ask", label: "Ask" },
    { value: "Edit", label: "Edit" },
    { value: "Agent", label: "Agent" }
];

// Mock history data for chat history
export const MOCK_HISTORY = [
    { id: 1, title: "Refactor Auth Component", date: "2 mins ago" },
    { id: 2, title: "Fix CSS Grid Layout", date: "1 hour ago" },
    { id: 3, title: "Explain Async/Await", date: "Yesterday" },
    { id: 4, title: "Generate API Tests", date: "2 days ago" },
];
