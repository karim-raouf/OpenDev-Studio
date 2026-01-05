import os
from pathlib import Path
from langchain_core.tools import tool

# --- 1. The Registry System ---
class ToolRegistry:
    def __init__(self):
        self._registry = []

    def register(self, scopes: list[str]):
        """
        Decorator to register a function as a LangChain tool 
        and assign it to specific scopes (Ask, Edit, Agent).
        """
        def decorator(func):
            # 1. Convert function to LangChain tool
            lc_tool = tool(func)
            
            # 2. Store metadata
            self._registry.append({
                "name": func.__name__,
                "tool": lc_tool,
                "scopes": scopes
            })
            
            # 3. Return the tool (so it can be used normally if needed)
            return lc_tool
        return decorator

    def get_tools(self, scope: str) -> list:
        """Filter and return the list of tools available for a specific scope."""
        return [
            item["tool"] 
            for item in self._registry 
            if scope in item["scopes"]
        ]

# Initialize the registry
registry = ToolRegistry()

# Define Scopes for clarity
PLANNER = "Planner"
ASK = "Ask"
EDIT = "Edit"
AGENT = "Agent"

# --- 2. Tool Definitions ---

# Helper function to generate full directory structure
def _generate_structure_recursive(path_obj: Path, prefix: str = "") -> str:
    if not path_obj.exists():
        return "Path not found."

    output = ""
    # Only print the root folder name on the very first call
    if prefix == "":
        output += f"{path_obj.name}/\n"

    try:
        # Get children
        children = sorted([
            p for p in path_obj.iterdir() 
            if not p.name.startswith('.')
        ], key=lambda x: (not x.is_dir(), x.name))
    except PermissionError:
        return f"{prefix}└── [Permission Denied]\n"

    for i, child in enumerate(children):
        is_last = (i == len(children) - 1)
        connector = "└── " if is_last else "├── "
        
        output += f"{prefix}{connector}{child.name}"
        
        if child.is_dir():
            output += "/"
            
        output += "\n"

        # RECURSION: Always dive deeper for directories
        if child.is_dir():
            extension = "    " if is_last else "│   "
            output += _generate_structure_recursive(child, prefix + extension)

    return output

@registry.register(scopes=[ASK, AGENT, PLANNER])
def get_project_structure(root_path: str = ".") -> str:
    """
    Generates a visual directory tree showing the full project structure.
    
    Args:
        root_path (str): The starting directory. Defaults to '.' (current).
    
    Returns:
        str: The complete directory tree string.
    """
    return _generate_structure_recursive(Path(root_path))

@registry.register(scopes=[ASK, AGENT, PLANNER])
def list_files(dir_path: str) -> str:
    """
    Lists all files and directories in a *specified directory*.

    Args:
        dir_path (str): The relative or absolute path of the directory to list.

    Returns:
        str: A newline-separated list of file names.
    """
    try:
        files = os.listdir(dir_path)
        if not files:
            return f"Directory '{dir_path}' is empty."
        return "\n".join(files)
    except Exception as e:
        return f"Error listing files in '{dir_path}': {str(e)}"

@registry.register(scopes=[EDIT, AGENT])
def write_to_file(file_path: str, content: str, start_line: int = None, end_line: int = None, overwrite_all: bool = True) -> str:
    """
    Writes the given text content to a specified file.
    Can either overwrite the entire file or replace specific lines.

    Args:
        file_path (str): The path of the file to write to.
        content (str): The text content to write into the file.
        start_line (int): The starting line number (1-indexed) to replace. Used if overwrite_all is False.
        end_line (int): The ending line number (1-indexed, inclusive) to replace. Used if overwrite_all is False.
        overwrite_all (bool): If True (default), overwrites the entire file. 
                              If False, replaces only lines from start_line to end_line.

    Returns:
        str: A string confirming the content was written or reporting an error.
    """
    try:
        if overwrite_all:
            # Original behavior: overwrite entire file
            with open(file_path, 'w', encoding='utf-8') as file:
                file.write(content)
            return f"Content written to file '{file_path}' successfully."
        else:
            # Targeted replacement: replace specific lines
            if start_line is None or end_line is None:
                return "Error: start_line and end_line are required when overwrite_all is False."
            
            if start_line < 1:
                return "Error: start_line must be >= 1."
            
            if end_line < start_line:
                return f"Error: end_line ({end_line}) must be >= start_line ({start_line})."
            
            # Read existing content
            try:
                with open(file_path, 'r', encoding='utf-8') as file:
                    lines = file.readlines()
            except FileNotFoundError:
                return f"Error: File '{file_path}' not found. Cannot do partial write on non-existent file."
            
            total_lines = len(lines)
            
            if start_line > total_lines + 1:
                return f"Error: start_line ({start_line}) exceeds file length ({total_lines} lines)."
            
            # Prepare new content lines (ensure they end with newline)
            new_content_lines = content.split('\n')
            new_content_lines = [line + '\n' if not line.endswith('\n') else line for line in new_content_lines]
            # Remove trailing newline from last line if original content didn't have it
            if content and not content.endswith('\n'):
                new_content_lines[-1] = new_content_lines[-1].rstrip('\n')
            
            # Build new file content
            # Lines before start_line (0-indexed: 0 to start_line-2)
            before = lines[:start_line - 1]
            # Lines after end_line (0-indexed: end_line onwards)
            after = lines[min(end_line, total_lines):]
            
            # Combine: before + new content + after
            new_lines = before + new_content_lines + after
            
            with open(file_path, 'w', encoding='utf-8') as file:
                file.writelines(new_lines)
            
            return f"Lines {start_line}-{end_line} in '{file_path}' replaced successfully."
    except Exception as e:
        return f"Error writing to file '{file_path}': {str(e)}"

@registry.register(scopes=[AGENT])
def create_directory(dir_name: str) -> str:
    """
    Creates a new directory at the specified path (including nested ones).

    Args:
        dir_name (str): The path of the directory to create.

    Returns:
        str: Confirmation message or error details.
    """
    try:
        os.makedirs(dir_name, exist_ok=True)
        return f"Directory '{dir_name}' created successfully."
    except Exception as e:
        return f"Error creating directory '{dir_name}': {str(e)}"

@registry.register(scopes=[AGENT])
def delete_directory(dir_name: str) -> str:
    """
    Deletes an *empty* directory. Fails if directory contains files.

    Args:
        dir_name (str): The path of the directory to delete.

    Returns:
        str: Confirmation message or error details.
    """
    try:
        os.rmdir(dir_name)
        return f"Directory '{dir_name}' deleted successfully."
    except Exception as e:
        return f"Error deleting directory '{dir_name}': {str(e)}"

@registry.register(scopes=[AGENT])
def create_file(file_name: str) -> str:
    """
    Creates a new, empty file. Overwrites if exists.

    Args:
        file_name (str): The path and name of the file to create.

    Returns:
        str: Confirmation message or error details.
    """
    try:
        with open(file_name, 'w', encoding='utf-8') as file:
            file.write("") 
        return f"File '{file_name}' created successfully."
    except Exception as e:
        return f"Error creating file '{file_name}': {str(e)}"

@registry.register(scopes=[AGENT])
def delete_file(file_name: str) -> str:
    """
    Deletes a specific file.

    Args:
        file_name (str): The path of the file to delete.

    Returns:
        str: Confirmation message or error details.
    """
    try:
        os.remove(file_name)
        return f"File '{file_name}' deleted successfully."
    except Exception as e:
        return f"Error deleting file '{file_name}': {str(e)}"

@registry.register(scopes=[ASK, AGENT, PLANNER])
def get_file_outline(file_path: str) -> str:
    """
    Shows the main components of a file by displaying only lines with zero indentation
    (lines that start at the beginning of the line) along with their line numbers.
    This is useful for getting an overview of a file's structure without loading all content 
    or even readin parts of the file.

    Args:
        file_path (str): The path of the file to analyze.

    Returns:
        str: A formatted string showing line numbers and zero-indentation lines,
             or an error message if the file cannot be read.
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            lines = file.readlines()
        
        if not lines:
            return f"File '{file_path}' is empty."
        
        outline = []
        for line_num, line in enumerate(lines, start=1):
            # Check if the line has zero indentation (starts at the beginning)
            # and is not just whitespace
            if line and not line[0].isspace() and line.strip():
                outline.append(f"Line {line_num}: {line.rstrip()}")
        
        if not outline:
            return f"No zero-indentation lines found in '{file_path}'."
        
        return "\n".join(outline)
    except FileNotFoundError:
        return f"Error: File '{file_path}' not found."
    except Exception as e:
        return f"Error reading file '{file_path}': {str(e)}"

@registry.register(scopes=[ASK, AGENT])
def read_file_partial(file_path: str, start_line: int = 1, end_line: int = 100, read_all: bool = False) -> str:
    """
    Reads a specific portion of a file or the entire file.

    Args:
        file_path (str): The path of the file to read.
        start_line (int): The starting line number (1-indexed, inclusive). Used if read_all is False.
        end_line (int): The ending line number (1-indexed, inclusive). Used if read_all is False.
        read_all (bool): If True, reads the entire file, ignoring start_line and end_line.

    Returns:
        str: The content of the specified line range or full file with line numbers,
             or an error message if the file cannot be read.
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            lines = file.readlines()
        
        total_lines = len(lines)
        
        if read_all:
            # Read everything
            start_index = 0
            end_index = total_lines
            display_start_line = 1
        else:
            # Validate inputs
            if start_line < 1:
                return "Error: start_line must be >= 1."
            
            if end_line < start_line:
                return f"Error: end_line ({end_line}) must be >= start_line ({start_line})."
            
            if start_line > total_lines:
                return f"Error: start_line ({start_line}) exceeds total lines ({total_lines})."
            
            # Adjust end_line if it exceeds total lines
            actual_end_line = min(end_line, total_lines)
            
            start_index = start_line - 1
            end_index = actual_end_line
            display_start_line = start_line
        
        # Extract the requested range
        selected_lines = lines[start_index:end_index]
        
        # Format with line numbers
        formatted_lines = [
            f"{line_num}: {line.removesuffix('\n').removesuffix('\r')}" 
            for line_num, line in enumerate(selected_lines, start=display_start_line)
        ]
        
        result = "\n".join(formatted_lines)
        
        if not read_all and end_index < end_line:
             result += f"\n\n[Note: Requested up to line {end_line}, but file only has {total_lines} lines]"
        
        return result
    except FileNotFoundError:
        return f"Error: File '{file_path}' not found."
    except Exception as e:
        return f"Error reading file '{file_path}': {str(e)}"


# --- 3. Usage Example (How to inject into Agents) ---

# When you initialize your ASK agent (Read-Only)
# Contains: [get_project_structure, read_file, list_files]

# When you initialize your EDIT agent (Focused Code Changes)

# Contains: [read_file, write_to_file]

# When you initialize your FULL AGENT (Architect)

# Contains: [All Tools]