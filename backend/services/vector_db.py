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

    def delete_repo(self, repo_name: str):
        try:
            # We can't easily query by prefix in Chroma where clause, so we get all and filter
            all_data = self.collection.get()
            if not all_data or not all_data.get('ids'): return
            ids_to_delete = [doc_id for doc_id in all_data['ids'] if doc_id.startswith(f"{repo_name}/")]
            if ids_to_delete:
                self.collection.delete(ids=ids_to_delete)
                print(f"Deleted {len(ids_to_delete)} vectors for repo {repo_name}")
        except Exception as e:
            print(f"ChromaDB Delete Error: {e}")