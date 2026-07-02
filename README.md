# 🧠 Codebase Intelligence Platform

A powerful, AI-driven Codebase Intelligence Platform designed to help developers instantly understand, navigate, and query massive codebases. Built with a modern **Next.js** frontend and a high-performance **FastAPI** backend using a custom **GraphRAG** (Retrieval-Augmented Generation) pipeline.

---

## ✨ Features

- **🚀 One-Click GitHub Ingestion:** Paste any public GitHub repository URL, and the engine will instantly clone it, parse its Abstract Syntax Tree (AST), and build a comprehensive vector index of all functions, classes, and dependencies.
- **🔗 Knowledge Graph Topology:** Generates an interactive, physics-based 2D force graph of your codebase architecture (viewable at `/tree`), allowing you to visually explore file dependencies.
- **🐙 GitHub Metadata Integration:** Automatically fetches the top 30 most recent Issues and Pull Requests via the GitHub API, saving them as Markdown files so the AI can answer questions about ongoing bugs and features.
- **🧜‍♀️ Mermaid Architecture Diagrams:** Ask the AI to draw dependency graphs or system architectures, and it will generate and render interactive Mermaid.js diagrams directly inside the chat interface.
- **🎓 Beginner Mode:** A specialized UI toggle that forces the AI engine to drop all complex technical jargon and explain concepts using simple, real-world analogies. Perfect for junior developers onboarding to a new codebase.
- **💎 Premium Aesthetic UI:** Built with TailwindCSS and Framer Motion, featuring dynamic glowing borders, glassmorphism, fluid animations, and a sleek dark mode.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router), React
- **Styling:** TailwindCSS
- **Animations:** Framer Motion, GSAP
- **Visualizations:** react-force-graph-2d, Mermaid.js
- **Markdown Parsing:** react-markdown

### Backend
- **Framework:** FastAPI, Python 3
- **AI Engine:** Google Gemini (gemini-2.5-flash)
- **Vector Database:** ChromaDB (Local Persistent)
- **Graph Database:** NetworkX
- **Code Parsing:** Python `ast` module
- **Git Integration:** GitPython, GitHub REST API

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+
- A Google Gemini API Key

### 1. Clone the Repository
```bash
git clone https://github.com/daksh23gupta10/codebase-intelligence-platform.git
cd codebase-intelligence-platform
```

### 2. Backend Setup
Navigate to the backend directory, set up your virtual environment, and run the FastAPI server:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt

# Create your .env file
copy .env.example .env
# Open .env and add your GEMINI_API_KEY=your_key_here

# Start the backend server on port 8080
python main.py
```

*Note: Ensure your `GEMINI_API_KEY` is properly configured or hardcoded in the backend environment before running queries.*

### 3. Frontend Setup
Open a new terminal, navigate to the frontend directory, and start the Next.js development server:

```bash
cd frontend
npm install

# Start the frontend on port 3000
npm run dev
```

### 4. Usage
- Open `http://localhost:3000` in your browser.
- Click the **Repository** button in the chat input or sidebar to ingest a public GitHub repository (e.g., `https://github.com/hwchase17/langchain`).
- Wait for the ingestion and AST parsing to complete.
- Ask the AI questions like:
  - *"Where is the authentication logic implemented?"*
  - *"Draw a dependency graph of the backend services."*
  - *"What are the currently open issues regarding the database?"*
- Toggle **Beginner Mode** in the top right for simplified explanations.
- Navigate to `http://localhost:3000/tree` to view the beautiful interactive topology graph!

---

## 📄 License
This project is licensed under the MIT License.
