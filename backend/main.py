from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import time
import asyncio
import os
import uvicorn
from dotenv import load_dotenv
from google import genai

from services.ingestion import RepositoryIngester
from services.ast_parser import ASTParser
from services.graph_db import KnowledgeGraph
from services.vector_db import VectorDB

load_dotenv()
try:
    gemini_client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
except Exception as e:
    print(f"Warning: Failed to initialize Gemini client: {e}")
    gemini_client = None

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize singletons for the services (lazy init for ML models to avoid slow startup)
ingester = None
ast_parser = None
graph_db = None
vector_db = None

def init_services():
    global ingester, ast_parser, graph_db, vector_db
    if not ingester:
        print("Initializing services...")
        ingester = RepositoryIngester()
        ast_parser = ASTParser()
        graph_db = KnowledgeGraph()
        vector_db = VectorDB()
        print("Services initialized.")

class IngestRequest(BaseModel):
    repo_url_or_path: str

class QueryRequest(BaseModel):
    query: str

@app.on_event("startup")
async def startup_event():
    # Defer heavy loading to first request or run in background
    pass

@app.get("/")
def read_root():
    return {"status": "ok"}

@app.post("/api/ingest")
async def ingest_codebase(request: IngestRequest):
    init_services()
    print(f"Starting ingestion for: {request.repo_url_or_path}")
    
    # 1. Clone/Copy Repository
    repo_path = ingester.ingest_repository(request.repo_url_or_path)
    
    files_processed = 0
    # 2. Traverse files
    for file_path in ingester.traverse_files(repo_path):
        try:
            # 3. Parse AST
            symbols = ast_parser.parse_file(file_path)
            
            # Read file content for vector DB
            with open(file_path, "r", encoding="utf-8") as f:
                code_content = f.read()
            
            rel_path = str(file_path.relative_to(repo_path))
            
            # 4. Add to Vector DB
            vector_db.add_document(
                doc_id=rel_path,
                text=code_content,
                metadata={"file": rel_path}
            )
            
            # 5. Add to Knowledge Graph
            graph_db.add_file(rel_path)
            if symbols:
                for func in symbols["functions"]:
                    graph_db.add_symbol(rel_path, func, "function")
                for cls in symbols["classes"]:
                    graph_db.add_symbol(rel_path, cls, "class")
                for imp in symbols["imports"]:
                    # Naive import linking
                    graph_db.add_import(rel_path, imp)
            
            files_processed += 1
        except Exception as e:
            print(f"Error processing {file_path}: {e}")
            
    summary = graph_db.get_summary()
    return {
        "status": "success", 
        "files_processed": files_processed,
        "graph_summary": summary
    }

@app.post("/api/query")
async def handle_query(request: QueryRequest):
    init_services()
    
    # Retrieve top 3 relevant results from the Vector DB
    results = vector_db.search(request.query, n_results=3)
    
    context = ""
    sources = []
    
    if results and results.get('documents') and len(results['documents']) > 0:
        docs = results['documents'][0]
        metadatas = results['metadatas'][0]
        
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import time
import asyncio
import os
import uvicorn
from dotenv import load_dotenv
from google import genai

from services.ingestion import RepositoryIngester
from services.ast_parser import ASTParser
from services.graph_db import KnowledgeGraph
from services.vector_db import VectorDB

load_dotenv()
try:
    gemini_client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
except Exception as e:
    print(f"Warning: Failed to initialize Gemini client: {e}")
    gemini_client = None

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize singletons for the services (lazy init for ML models to avoid slow startup)
ingester = None
ast_parser = None
graph_db = None
vector_db = None

def init_services():
    global ingester, ast_parser, graph_db, vector_db
    if not ingester:
        print("Initializing services...")
        ingester = RepositoryIngester()
        ast_parser = ASTParser()
        graph_db = KnowledgeGraph()
        vector_db = VectorDB()
        print("Services initialized.")

class IngestRequest(BaseModel):
    repo_url_or_path: str

class QueryRequest(BaseModel):
    query: str

@app.on_event("startup")
async def startup_event():
    # Defer heavy loading to first request or run in background
    pass

@app.get("/")
def read_root():
    return {"status": "ok"}

@app.post("/api/ingest")
async def ingest_codebase(request: IngestRequest):
    init_services()
    print(f"Starting ingestion for: {request.repo_url_or_path}")
    
    # 1. Clone/Copy Repository
    try:
        repo_path = ingester.ingest_repository(request.repo_url_or_path)
    except Exception as e:
        print(f"Error cloning repository: {e}")
        return {"status": "error", "message": "Failed to clone repository. Make sure the URL is public and valid."}
    
    repo_name = repo_path.name
    
    files_processed = 0
    # 2. Traverse files
    for file_path in ingester.traverse_files(repo_path):
        try:
            # 3. Parse AST
            symbols = ast_parser.parse_file(file_path)
            
            # Read file content for vector DB
            with open(file_path, "r", encoding="utf-8") as f:
                code_content = f.read()
            
            rel_path = str(file_path.relative_to(repo_path))
            # Prefix with repo_name to prevent collisions between multiple repos
            full_path = f"{repo_name}/{rel_path}"
            
            # 4. Add to Vector DB
            vector_db.add_document(
                doc_id=full_path,
                text=code_content,
                metadata={"file": full_path}
            )
            
            # 5. Add to Knowledge Graph
            graph_db.add_file(full_path)
            if symbols:
                for func in symbols["functions"]:
                    graph_db.add_symbol(full_path, func, "function")
                for cls in symbols["classes"]:
                    graph_db.add_symbol(full_path, cls, "class")
                for imp in symbols["imports"]:
                    # Naive import linking
                    graph_db.add_import(full_path, imp)
            
            files_processed += 1
        except Exception as e:
            print(f"Error processing {file_path}: {e}")
            
    summary = graph_db.get_summary()
    return {
        "status": "success", 
        "files_processed": files_processed,
        "graph_summary": summary
    }

def get_file_tree(path):
    tree = []
    if not os.path.exists(path):
        return tree
    for item in os.listdir(path):
        if item in {".git", "node_modules", "venv", "__pycache__", "dist", "build", ".next"}:
            continue
        item_path = os.path.join(path, item)
        if os.path.isdir(item_path):
            tree.append({
                "name": item,
                "type": "directory",
                "children": get_file_tree(item_path)
            })
        else:
            tree.append({
                "name": item,
                "type": "file"
            })
    # Sort: directories first, then files
    tree.sort(key=lambda x: (x["type"] == "file", x["name"]))
    return tree

@app.get("/api/files")
def list_files():
    workspaces_dir = os.path.join(os.getcwd(), "workspaces")
    tree = get_file_tree(workspaces_dir)
    return {"status": "success", "files": tree}

from fastapi import Query

@app.get("/api/file/content")
def get_file_content(path: str = Query(...)):
    workspaces_dir = os.path.join(os.getcwd(), "workspaces")
    # Resolve the full path securely to prevent directory traversal
    full_path = os.path.abspath(os.path.join(workspaces_dir, path))
    if not full_path.startswith(os.path.abspath(workspaces_dir)):
        return {"status": "error", "message": "Invalid path"}
    if not os.path.exists(full_path) or not os.path.isfile(full_path):
        return {"status": "error", "message": "File not found"}
    
    try:
        with open(full_path, "r", encoding="utf-8") as f:
            content = f.read(50000) # Read up to 50KB to avoid massive payloads
        
        stats = os.stat(full_path)
        return {
            "status": "success",
            "content": content,
            "size": stats.st_size,
            "modified": stats.st_mtime * 1000 # JS ms format
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

import shutil
import stat

def remove_readonly(func, path, exc_info):
    try:
        os.chmod(path, stat.S_IWRITE)
        func(path)
    except Exception:
        pass

@app.delete("/api/repos/{repo_name}")
def delete_repo(repo_name: str):
    init_services()
    try:
        # Delete from disk
        workspaces_dir = os.path.join(os.getcwd(), "workspaces")
        repo_path = os.path.join(workspaces_dir, repo_name)
        if os.path.exists(repo_path):
            shutil.rmtree(repo_path, onerror=remove_readonly)
            
        # Delete from vector DB
        vector_db.delete_repo(repo_name)
        
        # Delete from graph DB
        graph_db.delete_repo(repo_name)
        
        return {"status": "success", "message": f"Deleted {repo_name}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/api/query")
async def handle_query(request: QueryRequest):
    init_services()
    
    # Retrieve top 3 relevant results from the Vector DB
    results = vector_db.search(request.query, n_results=3)
    
    context = ""
    sources = []
    
    if results and results.get('documents') and len(results['documents']) > 0:
        docs = results['documents'][0]
        metadatas = results['metadatas'][0]
        
        for idx, doc in enumerate(docs):
            if not doc:
                continue
            file_path = metadatas[idx].get('file', f"snippet_{idx}")
            sources.append(file_path)
            
            # Truncate doc if it's too long to avoid overloading the API
            truncated_doc = doc[:2500] + ("\n...[TRUNCATED]" if len(doc) > 2500 else "")
            context += f"\n\n--- File: {file_path} ---\n{truncated_doc}"
            
    # Remove duplicate sources
    sources = list(set(sources))
    
    prompt = f"""You are a helpful coding assistant analyzing a codebase.
The user has asked a question. Use the following code snippets retrieved from the codebase to answer the question.
If the answer is not in the code snippets, say so. Do not hallucinate code. Try to be concise and accurate.
CRITICAL: You MUST explicitly state the exact file path and folder location (e.g., 'frontend/src/app/page.tsx') for any code you reference or explain.

User Question: {request.query}

Code Context:{context}
"""

    if not gemini_client:
        return {"answer": "Error: Gemini client not initialized. Check API key.", "sources": []}

    try:
        response = gemini_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        answer = response.text
    except Exception as e:
        answer = f"Error communicating with Gemini: {str(e)}"
    
    return {"answer": answer, "sources": sources}


if __name__ == '__main__':
    uvicorn.run(app, host='0.0.0.0', port=8080)
