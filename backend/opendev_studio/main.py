"""
OpenDev Studio - Main Application
FastAPI server for the Agentic Software Engineer system.
"""

import os
import sys

# =============================================================================
# PATH CONFIGURATION (Must be at top before other imports)
# =============================================================================
current_package_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_package_dir)

# =============================================================================
# STANDARD LIBRARY IMPORTS
# =============================================================================
import asyncio
import hashlib
import importlib
import json
import random
import shutil
import subprocess
import threading
import webbrowser

# =============================================================================
# THIRD-PARTY IMPORTS
# =============================================================================
from typing import List, Dict, Optional

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from langchain_core.messages import HumanMessage
from pydantic import BaseModel

# =============================================================================
# CONSTANTS & CONFIGURATION
# =============================================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
WORK_DIR = os.getcwd()
CONFIG_DIR = os.path.join(BASE_DIR, "OpenDevConfig")
env_path = os.path.join(CONFIG_DIR, ".env")

# =============================================================================
# ENVIRONMENT SETUP
# =============================================================================
print(f"📂 Loading environment from: {env_path}")
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    print("⚠️  WARNING: No .env file found. Agent may crash if API keys are missing.")

# =============================================================================
# AGENT IMPORT
# =============================================================================
graph_app = None
try:
    from graph.engineering_graph import app as graph_app
    print("✅ Agent Logic Imported Successfully")
except Exception as e:
    print(f"\n❌ Error importing agent logic: {e}\n")

# =============================================================================
# FASTAPI APPLICATION SETUP
# =============================================================================
app = FastAPI()

# Mount static assets
if os.path.exists(STATIC_DIR):
    assets_path = os.path.join(STATIC_DIR, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# PYDANTIC MODELS
# =============================================================================
class FileUpdate(BaseModel):
    path: str
    content: str


class FileCreate(BaseModel):
    path: str
    type: str


class FileDelete(BaseModel):
    path: str


class CommandRequest(BaseModel):
    command: str


# =============================================================================
# WEBSOCKET CONNECTION MANAGER
# =============================================================================
class ConnectionManager:
    """Manages WebSocket connections and active tasks."""

    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.active_tasks: Dict[WebSocket, asyncio.Task] = {}

    async def connect(self, websocket: WebSocket):
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection and cancel its active task."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if websocket in self.active_tasks:
            self.active_tasks[websocket].cancel()
            del self.active_tasks[websocket]

    async def broadcast(self, message: dict):
        """Broadcast a message to all active connections."""
        json_msg = json.dumps(message)
        for connection in list(self.active_connections):
            try:
                await connection.send_text(json_msg)
            except Exception:
                pass


manager = ConnectionManager()


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================
def get_dir_hash(path: str) -> str:
    """Calculate a hash of the directory structure for change detection."""
    hash_str = ""
    if not os.path.exists(path):
        return ""

    try:
        for root, dirs, files in os.walk(path):
            dirs.sort()
            files.sort()

            for d in dirs:
                hash_str += d
            for file in files:
                file_path = os.path.join(root, file)
                try:
                    stats = os.stat(file_path)
                    hash_str += f"{file}{stats.st_mtime}"
                except FileNotFoundError:
                    pass
    except Exception:
        pass

    return hashlib.md5(hash_str.encode()).hexdigest()


def build_file_tree(path: str) -> dict:
    """Build a tree structure representing the file system."""
    name = os.path.basename(path)
    node = {
        "id": os.path.abspath(path),
        "name": name,
        "type": "folder" if os.path.isdir(path) else "file",
        "isOpen": False,
    }

    if os.path.isdir(path):
        try:
            raw_children = os.listdir(path)
            children = [build_file_tree(os.path.join(path, x)) for x in raw_children]
            children.sort(key=lambda x: (x["type"] == "file", x["name"]))
            node["children"] = children
        except PermissionError:
            node["children"] = []

    return node


# =============================================================================
# BACKGROUND TASKS
# =============================================================================
async def watch_files():
    """Monitor the working directory for file changes."""
    if not os.path.exists(WORK_DIR):
        return

    print(f"👀 Watching files in: {WORK_DIR}")
    loop = asyncio.get_event_loop()

    # Initial hash
    last_hash = await loop.run_in_executor(None, get_dir_hash, WORK_DIR)

    while True:
        await asyncio.sleep(1)
        # Run hash calculation in thread to avoid blocking WebSocket
        current_hash = await loop.run_in_executor(None, get_dir_hash, WORK_DIR)

        if current_hash != last_hash:
            last_hash = current_hash
            await manager.broadcast({"type": "system_event", "event": "file_change"})


# =============================================================================
# AGENT LOGIC
# =============================================================================
async def run_agent_process(websocket: WebSocket, message: str, mode: str, provider: str):
    """Process a chat message through the agent graph with streaming output."""
    global graph_app

    try:
        # Lazy load agent if not already loaded
        if graph_app is None:
            if os.path.exists(env_path):
                load_dotenv(env_path, override=True)
            try:
                import graph.engineering_graph
                importlib.reload(graph.engineering_graph)
                graph_app = graph.engineering_graph.app
                print("✅ Agent loaded!")
            except Exception as e:
                await websocket.send_json({"type": "agent_error", "text": f"API Key Error: {e}"})
                return

        # Prepare inputs for the agent graph
        inputs = {
            "messages": [HumanMessage(content=message)],
            "mode": mode,
            "plan": [],
            "current_step_index": 0,
            "provider": provider
        }

        # Send initial thinking message
        await websocket.send_json({
            "type": "thinking", 
            "text": f"🧠 Starting {mode} mode..."
        })

        # Use streaming mode to get real-time updates
        loop = asyncio.get_event_loop()
        
        def stream_graph():
            """Stream graph execution and collect events."""
            events = []
            for event in graph_app.stream(inputs, config={"recursion_limit": 500}):
                events.append(event)
            return events
        
        # Run streaming in executor
        events = await loop.run_in_executor(None, stream_graph)
        
        # Process events and send updates
        final_response = None
        
        for event in events:
            # Each event is a dict with node name as key
            for node_name, node_output in event.items():
                # Send thinking updates for each node
                if node_name == "Planner":
                    plan = node_output.get("plan", [])
                    if plan:
                        step_count = len(plan)
                        pending_steps = sum(1 for s in plan if s.status == "pending")
                        await websocket.send_json({
                            "type": "thinking",
                            "text": f"📋 Plan: {step_count} steps ({pending_steps} pending)"
                        })
                    
                    if node_output.get("final_response"):
                        final_response = node_output["final_response"]
                        
                elif node_name in ["Ask", "Edit", "Agent"]:
                    # Get current step info
                    messages = node_output.get("messages", [])
                    if messages:
                        last_msg = messages[-1] if messages else None
                        if last_msg:
                            # Send thinking update about what the subgraph is doing
                            content_preview = str(last_msg.content)[:100]
                            await websocket.send_json({
                                "type": "thinking",
                                "text": f"⚙️ {node_name}: {content_preview}..."
                            })
        
        # Send final response
        if final_response:
            await websocket.send_json({"type": "agent_response", "text": final_response})
        else:
            # Fallback: get last message from final state
            if events:
                last_event = events[-1]
                for node_name, node_output in last_event.items():
                    messages = node_output.get("messages", [])
                    if messages:
                        response_text = messages[-1].content
                        await websocket.send_json({"type": "agent_response", "text": response_text})
                        break

    except asyncio.CancelledError:
        print("Agent task cancelled.")
        await websocket.send_json({"type": "agent_error", "text": "Stopped by user."})
    except Exception as e:
        print(f"Agent error: {e}")
        await websocket.send_json({"type": "agent_error", "text": f"Error: {str(e)}"})
    finally:
        if websocket in manager.active_tasks:
            del manager.active_tasks[websocket]


# =============================================================================
# APPLICATION LIFECYCLE EVENTS
# =============================================================================
@app.on_event("startup")
async def startup_event():
    """Initialize the application on startup."""
    if not os.path.exists(CONFIG_DIR):
        os.makedirs(CONFIG_DIR)
    if not os.path.exists(env_path):
        with open(env_path, "w") as f:
            f.write("API_KEY=your_api_key\n")
            
    asyncio.create_task(watch_files())


# =============================================================================
# WEBSOCKET ENDPOINT
# =============================================================================
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Handle WebSocket connections for real-time communication."""
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            command_type = data.get("type")

            if command_type == "chat":
                # Cancel any existing task for this connection
                if websocket in manager.active_tasks:
                    manager.active_tasks[websocket].cancel()

                task = asyncio.create_task(
                    run_agent_process(
                        websocket,
                        data.get("message"),
                        data.get("mode"),
                        data.get("provider")
                    )
                )
                manager.active_tasks[websocket] = task

            elif command_type == "stop":
                if websocket in manager.active_tasks:
                    manager.active_tasks[websocket].cancel()

    except WebSocketDisconnect:
        manager.disconnect(websocket)


# =============================================================================
# FILE OPERATION ENDPOINTS
# =============================================================================
@app.get("/files")
def get_files():
    """Get the file tree structure of the working directory."""
    if not os.path.exists(WORK_DIR):
        return {"error": "Directory not found"}
    tree = build_file_tree(WORK_DIR)
    return [tree]


@app.get("/files/content")
def get_file_content(path: str):
    """Read and return the content of a file."""
    try:
        if not os.path.exists(path):
            raise HTTPException(status_code=404, detail="File not found")

        # Try UTF-8 first (standard)
        try:
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
        except UnicodeDecodeError:
            # Fallback to Latin-1 (Windows default for non-unicode)
            try:
                with open(path, "r", encoding="latin-1") as f:
                    content = f.read()
            except Exception:
                # Binary or truly unreadable file
                return {"content": "<< Binary or Unreadable File >>"}

        return {"content": content}
    except Exception as e:
        print(f"Error reading {path}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/files/save")
def save_file(update: FileUpdate):
    """Save content to a file."""
    try:
        with open(update.path, "w", encoding="utf-8") as f:
            f.write(update.content)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/files/create")
def create_item(item: FileCreate):
    """Create a new file or folder."""
    try:
        full_path = item.path if os.path.isabs(item.path) else os.path.join(WORK_DIR, item.path)

        if item.type == "folder":
            os.makedirs(full_path, exist_ok=True)
        else:
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, "w") as f:
                f.write("")

        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/files/delete")
def delete_item(item: FileDelete):
    """Delete a file or folder."""
    try:
        full_path = item.path
        if os.path.isdir(full_path):
            shutil.rmtree(full_path)
        else:
            os.remove(full_path)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# TERMINAL ENDPOINT
# =============================================================================
@app.post("/terminal/execute")
def execute_command(req: CommandRequest):
    """Execute a shell command in the working directory."""
    try:
        result = subprocess.run(
            req.command,
            shell=True,
            cwd=WORK_DIR,
            capture_output=True,
            text=True
        )
        return {"stdout": result.stdout, "stderr": result.stderr}
    except Exception as e:
        return {"error": str(e)}


# =============================================================================
# UI SERVING ENDPOINTS
# =============================================================================
@app.get("/")
async def serve_root():
    """Serve the main index.html file."""
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"error": "index.html not found in 'static' folder"}


@app.get("/{catchall:path}")
async def serve_react_app(catchall: str):
    """Serve static files or fallback to index.html for React routing."""
    file_path = os.path.join(STATIC_DIR, catchall)

    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)

    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)

    return {"error": "Frontend files not found."}


# =============================================================================
# APPLICATION ENTRY POINT
# =============================================================================
def start():
    """Start the OpenDev Studio server."""
    port = 8000
    host = "127.0.0.1"
    url = f"http://{host}:{port}"

    print(f"🚀 OpenDev Studio starting at {url}")
    threading.Timer(1.5, lambda: webbrowser.open(url)).start()
    uvicorn.run(app, host=host, port=port, log_level="info")


if __name__ == "__main__":
    start()