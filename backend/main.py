from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import time
import asyncio
import os
import uvicorn
from services.ingestion import RepositoryIngester
from services.ast_parser import ASTParser
from services.graph_db import KnowledgeGraph
from services.vector_db import VectorDB

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
    # Mocking a response for the AI for now
    await asyncio.sleep(1.5) # Simulate processing time
    
    # Test vector DB search
    results = vector_db.search(request.query, n_results=1)
    context = ""
    if results and results['documents'] and len(results['documents'][0]) > 0:
        context = f"Found relevant context in {results['metadatas'][0][0]['file']}"
    
    mock_response = f"I am running in mock mode. You asked: '{request.query}'.\n\nIf this were the full implementation, I would have used Gemini to synthesize a response.\n\nVector Search returned: {context}"
    
    return {"answer": mock_response, "sources": ["mocked_file.py", "mocked_service.js"]}
