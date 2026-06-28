class VectorDB:
    def __init__(self):
        print("Initializing VectorDB Mock (Bypassing ChromaDB/PyTorch Windows pip hang)...")
        self.documents = []

    def add_document(self, doc_id: str, text: str, metadata: dict = None):
        if not text.strip():
            return
            
        self.documents.append({
            "id": doc_id,
            "text": text,
            "metadata": metadata or {}
        })

    def search(self, query: str, n_results: int = 5):
        # Extremely naive substring match for the mock
        results = [doc for doc in self.documents if query.lower() in doc["text"].lower()]
        
        return {
            "documents": [[doc["text"] for doc in results[:n_results]]],
            "metadatas": [[doc["metadata"] for doc in results[:n_results]]]
        }
