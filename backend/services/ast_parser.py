import tree_sitter
from tree_sitter import Language, Parser
import tree_sitter_python as tspython
import tree_sitter_javascript as tsjavascript
import tree_sitter_typescript as tstypescript
from pathlib import Path

class ASTParser:
    def __init__(self):
        self.parser = Parser()
        
        self.langs = {
            ".py": Language(tspython.language()),
            ".js": Language(tsjavascript.language()),
            ".jsx": Language(tsjavascript.language()),
            ".ts": Language(tstypescript.language_typescript()),
            ".tsx": Language(tstypescript.language_tsx()),
        }

    def parse_file(self, file_path: Path):
        ext = file_path.suffix
        if ext not in self.langs:
            return None
            
        self.parser.language = self.langs[ext]
        
        try:
            with open(file_path, "rb") as f:
                code = f.read()
            tree = self.parser.parse(code)
            return self.extract_symbols(tree, code, ext)
        except Exception as e:
            print(f"Error parsing {file_path}: {e}")
            return None
            
    def extract_symbols(self, tree, code: bytes, ext: str):
        symbols = {
            "functions": [],
            "classes": [],
            "imports": []
        }
        
        def traverse(node):
            if node.type in ['function_definition', 'function_declaration', 'method_definition', 'arrow_function']:
                # Try to find the name of the function
                for child in node.children:
                    if child.type == 'identifier':
                        name = code[child.start_byte:child.end_byte].decode('utf-8')
                        symbols["functions"].append(name)
                        break
            elif node.type in ['class_definition', 'class_declaration']:
                for child in node.children:
                    if child.type == 'identifier':
                        name = code[child.start_byte:child.end_byte].decode('utf-8')
                        symbols["classes"].append(name)
                        break
            elif node.type in ['import_statement', 'import_from_statement', 'import_declaration']:
                stmt = code[node.start_byte:node.end_byte].decode('utf-8')
                symbols["imports"].append(stmt)
                
            for child in node.children:
                traverse(child)
                
        traverse(tree.root_node)
        return symbols
