"""
Code Execution API Router - Runs code using Piston API
"""

from fastapi import APIRouter, HTTPException
import httpx
from typing import Optional

from app.models.schemas import ExecuteCodeRequest, ExecuteCodeResponse

router = APIRouter()

# Piston API endpoint (public instance)
PISTON_API_URL = "https://emkc.org/api/v2/piston"

# Language mappings for Piston
LANGUAGE_VERSIONS = {
    "python": "3.10.0",
    "python3": "3.10.0",
    "javascript": "18.15.0",
    "typescript": "5.0.3",
    "java": "15.0.2",
    "cpp": "10.2.0",
    "c": "10.2.0",
    "go": "1.16.2",
    "rust": "1.68.2",
    "ruby": "3.0.1",
}


async def get_available_runtimes():
    """Get list of available runtimes from Piston."""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{PISTON_API_URL}/runtimes")
        response.raise_for_status()
        return response.json()


@router.post("/execute", response_model=ExecuteCodeResponse)
async def execute_code(request: ExecuteCodeRequest):
    """
    Execute code using Piston API.
    Supports multiple languages including Python, JavaScript, Java, etc.
    """
    language = request.language.lower()
    
    # Map common aliases
    if language in ["py", "python3"]:
        language = "python"
    elif language in ["js", "node"]:
        language = "javascript"
    elif language in ["ts"]:
        language = "typescript"
    elif language in ["c++"]:
        language = "cpp"
    
    # Get version for language
    version = LANGUAGE_VERSIONS.get(language)
    if not version:
        # Try to use the language directly
        version = "*"
    
    payload = {
        "language": language,
        "version": version,
        "files": [
            {
                "name": f"main.{get_file_extension(language)}",
                "content": request.code
            }
        ],
        "stdin": request.stdin or "",
        "args": [],
        "compile_timeout": 10000,
        "run_timeout": 10000,
        "compile_memory_limit": -1,
        "run_memory_limit": -1
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{PISTON_API_URL}/execute",
                json=payload,
                timeout=30.0
            )
            
            if response.status_code != 200:
                error_detail = response.text
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Piston API error: {error_detail}"
                )
            
            result = response.json()
            
            # Extract run results
            run_result = result.get("run", {})
            compile_result = result.get("compile", {})
            
            stdout = run_result.get("stdout", "")
            stderr = run_result.get("stderr", "")
            
            # Include compile errors if any
            if compile_result.get("stderr"):
                stderr = f"Compile Error:\n{compile_result['stderr']}\n\n{stderr}"
            
            exit_code = run_result.get("code", 0)
            
            return ExecuteCodeResponse(
                stdout=stdout,
                stderr=stderr,
                exit_code=exit_code,
                execution_time=None  # Piston doesn't provide execution time
            )
            
    except httpx.TimeoutException:
        raise HTTPException(status_code=408, detail="Code execution timed out")
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"HTTP error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Execution error: {str(e)}")


def get_file_extension(language: str) -> str:
    """Get file extension for a language."""
    extensions = {
        "python": "py",
        "javascript": "js",
        "typescript": "ts",
        "java": "java",
        "cpp": "cpp",
        "c": "c",
        "go": "go",
        "rust": "rs",
        "ruby": "rb",
    }
    return extensions.get(language, "txt")


@router.get("/runtimes")
async def list_runtimes():
    """
    List available programming language runtimes.
    """
    try:
        runtimes = await get_available_runtimes()
        
        # Filter and format for frontend
        formatted = []
        for runtime in runtimes:
            formatted.append({
                "language": runtime["language"],
                "version": runtime["version"],
                "aliases": runtime.get("aliases", [])
            })
        
        return {"runtimes": formatted}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching runtimes: {str(e)}")


@router.post("/validate")
async def validate_code(request: ExecuteCodeRequest):
    """
    Validate code syntax without full execution.
    For Python, this just checks if the code parses.
    """
    if request.language.lower() in ["python", "python3", "py"]:
        try:
            compile(request.code, "<string>", "exec")
            return {"valid": True, "message": "Code syntax is valid"}
        except SyntaxError as e:
            return {
                "valid": False,
                "message": f"Syntax error at line {e.lineno}: {e.msg}",
                "line": e.lineno,
                "offset": e.offset
            }
    
    # For other languages, just return that validation is not supported
    return {"valid": True, "message": "Syntax validation not supported for this language"}
