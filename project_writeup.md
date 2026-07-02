# Codebase Intelligence Platform: A Hackathon Writeup

## 1. The Problem We Are Solving

Modern software development has a scaling problem. As repositories grow, they become massive, sprawling webs of interconnected dependencies. For a new developer onboarding to a project, or a senior developer trying to understand a legacy microservice, the experience is universally painful. Developers spend significantly more time reading and tracing code than actually writing it. 

Traditional IDE search (Ctrl+Shift+F) only finds syntax, not semantic meaning. Basic LLM coding assistants lack global context—they can only see the file you have open, missing the critical dependencies that lie three folders away. 

The problem is clear: **Developers lack a tool that provides both global architectural context and hyper-specific, localized code intelligence.**

## 2. Our Solution

We built the **Codebase Intelligence Platform**, a full-stack application powered by **GraphRAG** (Graph Retrieval-Augmented Generation). 

Instead of just embedding code into a standard vector database, our platform intelligently parses a GitHub repository's Abstract Syntax Tree (AST). It understands the codebase exactly how a compiler does—identifying functions, classes, and their complex relationships. It then combines this semantic understanding with a Vector Database, allowing developers to:
- **Chat with the Codebase:** Ask highly contextual questions like *"Where is the authentication flow?"* and get precise, file-specific answers.
- **Visualize the Architecture:** Navigate a physics-based 2D force graph (`/tree`) that maps every file and dependency visually.
- **Generate Mermaid Diagrams:** Ask the AI to draw dependency flowcharts, and the chat UI will instantly render interactive Mermaid.js diagrams.
- **Understand Context:** The platform automatically pulls active GitHub Issues and Pull Requests into its knowledge base, meaning the AI knows about ongoing bugs and active development, not just static code.
- **Learn at Your Pace:** A dedicated "Beginner Mode" toggle dynamically forces the AI to drop technical jargon and explain complex architectural concepts using simple, real-world analogies.

## 3. The Architecture

Our architecture is designed for speed, visual clarity, and deep contextual understanding.

* **The Frontend (The Lens):** Built with **Next.js 14**, **React**, and **TailwindCSS**. We utilized `react-force-graph-2d` for the interactive topology mapping and built a custom `react-markdown` parser that natively compiles Mermaid.js code blocks into SVGs within the chat window. The UI is designed with a premium, futuristic aesthetic utilizing Framer Motion.
* **The Backend (The Engine):** A **FastAPI (Python)** server that handles the heavy lifting.
  * **AST Parser:** Reads the raw Python/JS code and extracts structural metadata.
  * **NetworkX:** Builds the semantic knowledge graph of dependencies.
  * **ChromaDB:** A local, persistent vector database that stores code embeddings for ultra-fast semantic retrieval.
  * **Google Gemini AI:** The core brain of the platform. We utilize advanced prompt engineering (including dynamic instruction injection for Beginner Mode and Mermaid rules) to route the GraphRAG context into human-readable answers.
  * **GitHub REST API Integration:** A dynamic ingestion script that clones repos and fetches the top 30 Issues/PRs directly into the RAG pipeline.

## 4. Our Journey

The journey of building this platform was a massive exercise in pushing the boundaries of what RAG can do. 

We started with a simple hypothesis: *Can we make chatting with a codebase better?* Initially, we built a standard vector search. But we quickly realized that vector search alone is blind to architecture—it knows *what* the code is, but not *how* it connects.

That realization led to our biggest breakthrough: **The Knowledge Graph**. We integrated NetworkX and AST parsing, transforming our basic RAG into GraphRAG. Suddenly, the AI didn't just know about a function; it knew every file that called that function.

From there, the project evolved rapidly based on user experience. We realized that seeing the code wasn't enough, so we built the visual `/tree` topology map. We realized static code lacked context, so we wired up the GitHub API to ingest live Issues and PRs. 

Finally, we polished the UX. We noticed that AI explanations of complex systems could still be overwhelming, so we engineered **"Beginner Mode"**. We saw the need for structural visualization in chat, so we built the **Mermaid.js interception engine**. 

What started as a simple AI chat wrapper evolved into a complete, visually stunning Codebase Intelligence Platform that fundamentally changes how developers interact with large-scale projects.

---

# Appendix A: Product Requirements Document (PRD)

| | |
|---|---|
| **Product** | Codebase Intelligence Platform |
| **Doc type** | Product Requirements Document (PRD) |
| **Status** | Finalized |
| **Version** | v1.0 |
| **Last updated** | 02 July 2026 |
| **Author** | Product team |
| **Related docs** | Technical Requirements Document (TRD) |

## 1. Overview

The Codebase Intelligence Platform is a full-stack, AI-powered developer tool that ingests, indexes, and analyzes entire software repositories so developers can **chat with their codebase**. It is built on a **Graph Retrieval-Augmented Generation (GraphRAG)** architecture: a local vector database holds embedded representations of the code, a NetworkX graph maps the topology, and a Google Gemini model answers natural-language questions grounded in the retrieved snippets. 

The product spans three experiences: a codebase ingestion engine that clones a public GitHub repository and parses it via an AST parser; a conversational chat interface for asking architectural questions with support for dynamic Mermaid diagrams and Beginner Mode; and a visual 2D force graph (`/tree`) to explore the project topology.

## 2. Objective

**Primary objective:** Let a developer understand an unfamiliar or large codebase in minutes instead of days by providing precise, AI-driven explanations, real-time architectural visualizations, and context from ongoing GitHub Issues/PRs.

Supporting objectives:
- **Grounded accuracy over fluency.** Answers must be traceable to real code via file-path citations.
- **Visual learning.** Provide a rich topology map and Mermaid.js architecture flowcharts to help visual learners.
- **Context-aware.** Incorporate GitHub Issues and Pull Requests so the AI understands ongoing project development.
- **Premium, trustworthy UX.** The UI must feel futuristic and reliable, utilizing fluid animations and dark-mode aesthetics.

## 3. Target Audience

**Primary — Engineers onboarding to a codebase.** New hires, contractors, or engineers rotating onto an unfamiliar service who need to learn architecture quickly.
**Secondary — Visual learners & Junior Developers.** Utilizing the Mermaid diagramming and "Explain like I'm a beginner" features to bridge the knowledge gap.

## 4. Features

### 4.1 Codebase Ingestion Engine & Knowledge Graph
- Ingest a public GitHub repository URL.
- **AST parsing** to extract functions, classes, and imports.
- Builds a dual-index: **ChromaDB** for semantic vector search and **NetworkX** for topological graph relationships.
- Automatically fetches the top 30 **GitHub Issues and Pull Requests** via REST API to enrich the vector DB context.

### 4.2 AI Chat Interface & Beginner Mode
- Conversational UI for complex architectural queries.
- **Beginner Mode Toggle:** Dynamically injects strict system prompts to force the AI to use simple analogies and drop complex jargon.
- **Mermaid.js Integration:** The AI outputs architecture diagrams as Mermaid code blocks, which the UI automatically intercepts and renders into interactive SVGs.

### 4.3 Visual Topology Map
- Dedicated `/tree` route rendering a physics-based `react-force-graph-2d`.
- Nodes represent directories and files, linked by imports/structure, giving users a bird's-eye view of the codebase.

## 5. Success Metrics

| Metric | Definition | Why it matters |
|---|---|---|
| **Citation accuracy** | % of answers correctly citing exact file paths | Core trust metric |
| **Graph completion** | % of files successfully mapped into the NetworkX graph | Validates AST parsing strength |
| **Ingestion success rate** | % of GitHub repos that index without failure | Reliability of the engine |

---

# Appendix B: Technical Requirements Document (TRD)

| | |
|---|---|
| **Product** | Codebase Intelligence Platform |
| **Doc type** | Technical Requirements Document (TRD) |
| **Status** | Finalized |
| **Version** | v1.0 |
| **Last updated** | 02 July 2026 |
| **Author** | Engineering team |
| **Related docs** | Product Requirements Document (PRD) |

## 1. System Architecture

The platform uses a Next.js frontend, a FastAPI backend, a local persistent vector store (ChromaDB), a graph database (NetworkX), and an external LLM (Google Gemini). 

### 1.1 High-level components
- **Frontend (Next.js / React):** Handles chat UI, Mermaid.js rendering via custom `react-markdown` components, and the `/tree` topology map via `react-force-graph-2d`.
- **Backend API (FastAPI on Uvicorn):** Ingestion orchestration, AST parsing, Git metadata extraction, embedding, and the GraphRAG query pipeline.
- **Vector store (ChromaDB):** Stores embedded code chunks and GitHub metadata (Issues/PRs).
- **Graph store (NetworkX):** Maps the AST relationships to build a semantic topology.
- **LLM (Google Gemini 2.5 Flash):** Generates grounded answers under strict system prompt constraints (citations, Mermaid usage, Beginner Mode tone).

### 1.2 Ingestion flow
1. User submits a public GitHub URL.
2. Backend clones the repo to a workspace.
3. The AST parser extracts functions, classes, and dependencies, building the **NetworkX graph**.
4. The GitHub metadata pipeline fetches the top 30 Issues/PRs and saves them locally as Markdown.
5. All units (Code + Metadata) are chunked, embedded via Gemini embeddings, and upserted into **ChromaDB**.

### 1.3 Query flow (GraphRAG)
1. Frontend calls `POST /api/query` passing the query and UI state (e.g., `beginner_mode` flag).
2. Backend embeds the query, retrieving top semantic hits from ChromaDB (which now includes Issues/PRs).
3. The backend assembles a prompt injecting instructions based on the `beginner_mode` flag and strict rules for Mermaid generation.
4. Gemini generates the answer, formatting architecture responses as ````mermaid```` blocks.
5. Frontend parses the Markdown; intercepts Mermaid blocks, and renders the interactive SVG.

## 2. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend framework | **Next.js 14 (React)** | App shell, routing, chat UI |
| Styling / Animation | **Tailwind CSS, Framer Motion** | Premium UI/UX |
| Markdown / Diagrams | **react-markdown, mermaid.js** | Renders Mermaid charts dynamically |
| Topology Map | **react-force-graph-2d** | Renders the NetworkX JSON dump |
| Backend framework | **Python 3 + FastAPI** | REST API served by Uvicorn |
| Vector database | **ChromaDB (local, persistent)** | Semantic search |
| Graph database | **NetworkX** | Maps semantic AST relationships |
| LLM SDK / Embeddings | **Google GenAI SDK** | Model: `gemini-2.5-flash` |
| Git Integration | **GitHub REST API** | Fetches top 30 Issues / PRs |

## 3. Data Models

### 3.1 Code Chunk & Metadata (ChromaDB)
| Field | Type | Notes |
|---|---|---|
| `id` | string | Stable deterministic ID |
| `embedding` | vector | Gemini text embeddings |
| `document` | string | Code snippet or GitHub Issue/PR text |
| `metadata.source_type` | enum | `code` \| `github_issue` \| `github_pr` |
| `metadata.file_path` | string | Required for citations |

### 3.2 Graph Topology (NetworkX Export)
| Field | Type | Notes |
|---|---|---|
| `nodes` | list | Directory or file nodes with metadata |
| `links` | list | Import or structural relationships mapping dependencies |

## 4. Security & Deployment Considerations
- **LLM Data Privacy:** Retrieved code snippets are sent to the external Gemini model at query time. The vector DB and graph DB remain local.
- **Input Safety:** GitHub URL clones run in an isolated temp workspace and are deleted after ingestion.
- **Port:** Frontend runs on 3000, Backend serves on 8080.
- **API Keys:** Gemini API key is maintained securely on the backend environment.
