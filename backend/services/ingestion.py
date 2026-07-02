import os
import shutil
import stat
import git
import requests
import json
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
            self.fetch_github_metadata(repo_url_or_path, dest_dir)
            return dest_dir

    def fetch_github_metadata(self, repo_url: str, dest_dir: Path):
        try:
            parts = repo_url.rstrip("/").split("/")
            if len(parts) >= 2:
                owner = parts[-2]
                repo = parts[-1].replace(".git", "")
            else:
                return

            issues_url = f"https://api.github.com/repos/{owner}/{repo}/issues?state=all&per_page=30"
            headers = {"Accept": "application/vnd.github.v3+json"}
            
            response = requests.get(issues_url, headers=headers, timeout=10)
            if response.status_code != 200:
                print(f"Failed to fetch GitHub metadata: {response.status_code} - {response.text}")
                return
                
            issues = response.json()
            if not issues:
                return
                
            metadata_dir = dest_dir / "GitHub_Metadata"
            issues_dir = metadata_dir / "Issues"
            prs_dir = metadata_dir / "PullRequests"
            
            issues_dir.mkdir(parents=True, exist_ok=True)
            prs_dir.mkdir(parents=True, exist_ok=True)
            
            for item in issues:
                title = item.get("title", "No Title")
                number = item.get("number", "Unknown")
                state = item.get("state", "open")
                user = item.get("user", {}).get("login", "Unknown")
                body = item.get("body", "") or "No description provided."
                
                is_pr = "pull_request" in item
                
                content = f"# {'Pull Request' if is_pr else 'Issue'} #{number}: {title}\n\n"
                content += f"**State:** {state.upper()}\n"
                content += f"**Author:** {user}\n\n"
                content += f"## Description\n{body}\n"
                
                safe_title = "".join([c if c.isalnum() else "_" for c in title])[:30]
                filename = f"{'PR' if is_pr else 'Issue'}_{number}_{safe_title}.md"
                
                if is_pr:
                    filepath = prs_dir / filename
                else:
                    filepath = issues_dir / filename
                    
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(content)
                    
            print(f"Successfully fetched {len(issues)} GitHub metadata items.")
        except Exception as e:
            print(f"Error fetching GitHub metadata: {e}")

    def traverse_files(self, repo_path: Path):
        valid_extensions = {".py", ".js", ".ts", ".jsx", ".tsx", ".css", ".html", ".json", ".md", ".yml", ".yaml"}
        ignore_dirs = {".git", "node_modules", "venv", "__pycache__", "dist", "build"}
        
        for root, dirs, files in os.walk(repo_path):
            dirs[:] = [d for d in dirs if d not in ignore_dirs]
            for file in files:
                if Path(file).suffix in valid_extensions:
                    yield Path(root) / file