# 🚀 Local Development Guide

Welcome to the **LAS Analyzer** local setup guide! This document will walk you through setting up your development environment from scratch.

---

## � Prerequisites

Ensure you have the following installed on your system:

| Tool | Version | Purpose |
| :--- | :--- | :--- |
| **Node.js** | v18.x+ | Application Runtime |
| **npm** | v9.x+ | Package Management |
| **Docker** | Latest | Containerized Database (Recommended) |
| **Git** | Latest | Source Control |

---

## 🛠️ Step 1: Clone & Prepare

Open your terminal and run the following commands to get the source code:

```bash
# Clone the repository
git clone https://github.com/adldi07/LAS-Analyzer

# Navigate to the project root
cd LAS-Analyzer
```

---

## �️ Step 2: Database Infrastructure

The application requires **PostgreSQL**. You have two ways to set this up:

### 💡 Option A: The Fast Way (Docker Compose)
*Highly recommended. No installation or configuration needed.*

1.  **Configure Environment**:
    Navigate to the project root and copy the example environment file:
    ```bash
    # Windows
    copy .env.example .env
    # Mac/Linux
    cp .env.example .env
    ```
    *(Note: You can keep the default values for local development)*

2.  **Start the database container**:
    ```bash
    docker-compose up db -d
    ```
    *Note: It there is db in between -- to run only postgres container from docker-compose.yml*
3.  **Connection Details**:
    - **Host**: `localhost:5432`
    - **User**: `postgres` | **Pass**: `admin123`
    - **DB Name**: `las_analyzer`
    - *Note: If you change these, ensure you update the backend `.env` accordingly.*

### 🔧 Option B: Manual Installation
1.  Install PostgreSQL locally.
2.  Create a fresh database named `las_analyzer`.
3.  **Important**: Run the initialization script found at `backend/src/models/schema.sql` to create the tables and indexes.

---

## 🔧 Step 3: Backend Configuration

1.  **Navigate & Install**:
    ```bash
    cd backend
    npm install
    ```
2.  **Set Environment Variables**:
    Copy the example environment file and add your specific keys (AWS and Claude):
    ```bash
    # Windows
    copy .env.example .env
    # Mac/Linux
    cp .env.example .env
    ```
    *Required for full functionality: `CLAUDE_API_KEY`, `AWS_SECRET_ACCESS_KEY`, etc.*

3.  **Launch**:
    ```bash
    npm run dev
    ```
    *You should see: `🚀 Server running on port 3000`*

---

## 🎨 Step 4: Frontend Configuration

1.  **Navigate & Install** (in a new terminal):
    ```bash
    cd frontend
    npm install
    ```
2.  **Set Environment Variables**:
    Copy the example environment file:
    ```bash
    # Windows
    copy .env.example .env
    # Mac/Linux
    cp .env.example .env
    ```
3.  **Launch**:
    ```bash
    npm run dev
    ```
    *The app is now live at: `http://localhost:5173`*

---

## 🧪 Step 5: Verification & First Flight

1.  Open [http://localhost:5173](http://localhost:5173) in your browser.
2.  **Test Upload**: Use the sample file provided at `backend/tests/fixtures/sample-las.las`.
3.  **View Results**: Click on the well row to see the interactive charts.
4.  **AI interpretation**: Click "Generate AI Interpretation" to verify the LLM integration.

---

## 🆘 Troubleshooting

| Issue | Solution |
| :--- | :--- |
| **"Database connection failed"** | Ensure Docker is running. If using a local DB, verify the `DATABASE_URL` matches your local credentials. |
| **"CORS Error"** | Ensure `VITE_API_URL` in the frontend `.env` matches the backend address exactly. |
| **LAS File won't upload** | Check that your AWS S3 credentials are correct and the bucket exists. |
| **Port 3000 is busy** | Change the `PORT` in `backend/.env` and update the frontend `VITE_API_URL` accordingly. |

---

> **Note**: For production deployment instructions (AWS/EC2), refer to the main [README.md](./README.md).
