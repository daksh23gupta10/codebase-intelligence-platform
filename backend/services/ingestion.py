import os
import shutil
import stat
import git
from pathlib import Path

def remove_readonly(func, path, _):
    os.chmod(path, stat.S_IWRITE)
    func(path)

class RepositoryIngester:
    def __init__(self):
        self.workspace_dir = Path("workspaces")
        self.workspace_dir.mkdir(exist_ok=True)

    def ingest_repository(self, repo_url_or_path: str) -> Path:
        """Clones a remote repo or copies a local path to the workspace."""
        if os.path.exists(repo_url_or_path):
            repo_name = os.path.basename(os.path.normpath(repo_url_or_path)) or "local_repo"
            dest_dir = self.workspace_dir / repo_name
            if dest_dir.exists():
                shutil.rmtree(dest_dir, onerror=remove_readonly)
            
            shutil.copytree(
                repo_url_or_path, dest_dir, 
                ignore=shutil.ignore_patterns('node_modules', '.git', 'venv', '__pycache__', 'dist', 'build')
            )
            return dest_dir
        else:
            repo_name = repo_url_or_path.split("/")[-1].replace(".git", "")
            dest_dir = self.workspace_dir / repo_name
            if dest_dir.exists():
                shutil.rmtree(dest_dir, onerror=remove_readonly)
            git.Repo.clone_from(repo_url_or_path, dest_dir)
            return dest_dir

    def traverse_files(self, repo_path: Path):
        valid_extensions = {".py", ".js", ".ts", ".jsx", ".tsx", ".css", ".html", ".json", ".md", ".yml", ".yaml"}
        ignore_dirs = {".git", "node_modules", "venv", "__pycache__", "dist", "build"}
        
        for root, dirs, files in os.walk(repo_path):
            dirs[:] = [d for d in dirs if d not in ignore_dirs]
            for file in files:
                if Path(file).suffix in valid_extensions:
                    yield Path(root) / file