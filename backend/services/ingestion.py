import os
import shutil
import git
from pathlib import Path

class RepositoryIngester:
    def __init__(self):
        self.workspace_dir = Path("workspaces")
        self.workspace_dir.mkdir(exist_ok=True)

    def ingest_repository(self, repo_url_or_path: str) -> Path:
        """Clones a remote repo or copies a local path to the workspace."""
        # Check if local path
        if os.path.exists(repo_url_or_path):
            repo_name = os.path.basename(os.path.normpath(repo_url_or_path))
            if not repo_name:
                repo_name = "local_repo"
            dest_dir = self.workspace_dir / repo_name
            if dest_dir.exists():
                shutil.rmtree(dest_dir)
            
            # Ignore heavy/unnecessary folders during local copy
            shutil.copytree(
                repo_url_or_path, 
                dest_dir, 
                ignore=shutil.ignore_patterns('node_modules', '.git', 'venv', '__pycache__', 'dist', 'build')
            )
            return dest_dir
        else:
            # Assume it's a git URL
            repo_name = repo_url_or_path.split("/")[-1].replace(".git", "")
            dest_dir = self.workspace_dir / repo_name
            if dest_dir.exists():
                shutil.rmtree(dest_dir)
            git.Repo.clone_from(repo_url_or_path, dest_dir)
            return dest_dir

    def traverse_files(self, repo_path: Path):
        """Yields file paths that we want to parse (e.g. .py, .js, .ts)."""
        valid_extensions = {".py", ".js", ".ts", ".jsx", ".tsx"}
        ignore_dirs = {".git", "node_modules", "venv", "__pycache__", "dist", "build"}
        
        for root, dirs, files in os.walk(repo_path):
            dirs[:] = [d for d in dirs if d not in ignore_dirs]
            for file in files:
                ext = Path(file).suffix
                if ext in valid_extensions:
                    yield Path(root) / file
