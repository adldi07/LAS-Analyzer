# 🛢️ LAS Analyzer: Engineering-Grade Well Log Intelligence

[![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?style=flat-square&logo=nodedotjs)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2016-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![AWS](https://img.shields.io/badge/Cloud-AWS-FF9900?style=flat-square&logo=amazon-aws)](https://aws.amazon.com/)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?style=flat-square&logo=github-actions)](https://github.com/features/actions)

> **Transforming raw subsurface data into actionable geological insights.** LAS Analyzer is a full-stack platform designed to bridge the gap between complex petrophysical data and modern AI reasoning.

---

## 🌎 Live Environment
*   **🚀 Production App**: [las-analyzer.vercel.app](https://las-analyzer.vercel.app)
*   **🔌 System API**: [https://13-201-9-95.sslip.io/api](https://13-201-9-95.sslip.io/api)
*   **💓 Health Status**: [https://13-201-9-95.sslip.io/health](https://13-201-9-95.sslip.io/health)

---

## 🏁 Getting Started
If you are an evaluator or developer looking to run this project locally, please jump to our dedicated guide:
👉 **[Local Setup Guide: Run Literally Anywhere](./run_locally.md)**

---

## 🔥 Project Highlights & Innovations

### 🔍 1. Smart LAS Ingestion Engine
Unlike generic data parsers, this system is engineered specifically for the **Log ASCII Standard (LAS)** format.
- **Header Intelligence**: Automatically mines critical metadata like `WELL`, `FIELD`, `API Number`, and `Company` from the LAS header.
- **Metadata Indexing**: Pre-calculates statistical envelopes (`min`, `max`, `mean`) for every curve during ingestion. This allows the AI to have instant "Contextual Awareness" without re-processing entire datasets for every query.
- **Hybrid Storage Architecture**: Combines the durability of **Amazon S3** (for raw file preservation) with the agility of **PostgreSQL** (for structured data access and performance).

### 📊 2. High-Performance Petrophysical Visualizer
Visualization is the fundamental tool for geological reasoning.
- **Synchronized Multi-Track Views**: Render multiple curves side-by-side on a shared, unified depth axis.
- **Precision Interaction**: Built-in support for zooming, panning, and interval isolation to focus on specific reservoirs or zones of interest.
- **Modern UI/UX**: A clean, "Glassmorphism" dashboard built with **Tailwind CSS** and **Plotly.js**, optimized for high-density data interpretation.

### 🧠 3. Context-Aware AI Petrophysicist
We've integrated the world's most sophisticated reasoning model (**Claude 3.5 Sonnet**) directly into the workflow.
- **Automated Lithology Insights**: Identifies rock types, fluid contacts, and potential anomalies based on numerical curve signatures.
- **Persistent AI Assistant**: A specialized chatbot that understands the *current* well you are viewing. It doesn't just guess; it checks the actual statistics and metadata of the active well to answer your questions.

---

## 🏗️ Technical Architecture

### System Data Flow
1.  **Ingestion**: User uploads LAS -> Backend parses numerical data -> S3 (Raw Archive) + Postgres (Metadata/Index).
2.  **Visualization**: Frontend requests optimized data segments -> Express returns JSON -> Plotly renders interactive tracks.
3.  **AI Engine**: Frontend triggers analysis -> Backend collects DB stats + User prompt -> Anthropic API generates reasoning -> Results stored in `interpretations` table.

### Technology Stack
| Layer | Tech Choice | Why? |
| :--- | :--- | :--- |
| **Frontend** | React 19 + Vite | Minimal bundle size, blazing fast HMR, and modern hooks. |
| **Styling** | Tailwind CSS | Utility-first approach for consistent, premium aesthetics. |
| **Backend** | Node.js (Express) | High concurrency for I/O bound parsing tasks. |
| **Database** | PostgreSQL 16 | Relational power for complex well-to-curve modeling. |
| **AI Intelligence** | Claude 3.5 Sonnet | Superior technical reasoning compared to other LLMs. |
| **Infrastructure** | Docker + AWS | Industry-standard reliability and container portability. |

---

## 📂 Project Structure
- `/frontend`: React application, UI components, and visualization logic.
- `/backend`: Express API, LAS parsing engine, and database logic.
- `/docker-compose.yml`: Local and production container orchestration.
- `/.github/workflows`: Fully automated Build -> Push -> Deploy pipelines.
- `run_locally.md`: Comprehensive developer onboarding guide.

---

## 🚢 Continuous Deployment (CI/CD)
This project follows professional **DevOps** practices:
- **Build**: Every push to `main` triggers a GitHub Action to build a production Docker image.
- **Storage**: Images are securely stored in **Amazon ECR**.
- **Deployment**: The pipeline SSHes into an **AWS EC2** instance and orchestrates a fresh rollout using Docker Compose.
- **Frontend**: Automatically synchronized and served via **Vercel** with global edge CDN.

---

## 📽️ Demo Presentation
*[Placeholder: Google Drive Link(will add after making the video)]*

---

## ✅ Deliverables Checklist

- [x] **Core Architecture**: Decoupled Full-Stack design via REST API.
- [x] **Data Ingestion**: Multi-stage parsing and S3/Postgres storage.
- [x] **Visualization**: Interactive Track-based Plotly.js charts.
- [x] **AI Interpretation**: Deep petrophysical analysis via Anthropic AI.
- [x] **Bonus Feature**: Specialized context-aware Well Chatbot.
- [x] **Cloud Deployment**: Live on **AWS** and **Vercel**.
- [x] **Documentation**: Standard `README` and `Local Setup` guides.

---

## 👤 Project Information
**Author**: adldi07 (Adesh Kumar | IIT ISM Dhanbad)
**Project Status**: 🟢 Production Ready / Full Feature Complete

---

> *Designed and engineered for One-Geo as a demonstration of high-performance full-stack data applications.*
