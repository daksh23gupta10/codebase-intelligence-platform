import networkx as nx

class KnowledgeGraph:
    def __init__(self):
        self.graph = nx.DiGraph()

    def add_file(self, file_path: str):
        self.graph.add_node(file_path, type="file")

    def add_symbol(self, file_path: str, symbol_name: str, symbol_type: str):
        symbol_id = f"{file_path}::{symbol_name}"
        self.graph.add_node(symbol_id, type=symbol_type, name=symbol_name)
        self.graph.add_edge(file_path, symbol_id, relationship="CONTAINS")

    def add_import(self, source_file: str, imported_module: str):
        self.graph.add_edge(source_file, imported_module, relationship="IMPORTS")

    def get_summary(self):
        return {
            "nodes": self.graph.number_of_nodes(),
            "edges": self.graph.number_of_edges()
        }

    def delete_repo(self, repo_name: str):
        nodes_to_remove = [node for node in self.graph.nodes if str(node).startswith(f"{repo_name}/")]
        self.graph.remove_nodes_from(nodes_to_remove)
        print(f"Deleted {len(nodes_to_remove)} nodes from graph for repo {repo_name}")
