import chromadb

class VectorDB:
    def __init__(self):
        print("Initializing Local Persistent ChromaDB...")
        self.client = chromadb.PersistentClient(path="./chroma_db")
        self.collection = self.client.get_or_create_collection(name="codebase_collection")

    def add_document(self, doc_id: str, text: str, metadata: dict = None):
        if not text.strip():
            return
            
        self.collection.upsert(
            ids=[doc_id],
            documents=[text],
            metadatas=[metadata or {}]
        )

    def search(self, query: str, n_results: int = 5):
        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=n_results
            )
            return results
        except Exception as e:
            print(f"ChromaDB Search Error: {e}")
            return {"documents": [[]], "metadatas": [[]]}