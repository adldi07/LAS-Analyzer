# LAS Analyzer Backend

This is the backend service for the LAS Well Log Analyzer, a full-stack application for processing, visualizing, and interpreting geological well log data (LAS files).

## 🚀 Features

-   **LAS File Parsing**: Robust parsing of LAS 2.0 files using a custom-built parser.
-   **Data Storage**: Efficient storage of well metadata, curves, and millions of measurement points in PostgreSQL.
-   **Cloud Storage**: Integration with AWS S3 for secure file storage (optional but recommended).
-   **API**: RESTful API for frontend integration.
-   **AI Integration**: Powered by **Anthropic Claude 3.5 Sonnet** for:
    -   Automated geological interpretation.
    -   Statistical anomaly detection.
    -   Correlation analysis.
    -   Interactive chat with well data context.

## 🛠️ Tech Stack

-   **Runtime**: Node.js (v18+)
-   **Framework**: Express.js
-   **Database**: PostgreSQL
-   **AI Model**: Anthropic Claude 3.5 Sonnet (`@anthropic-ai/sdk`)
-   **Cloud**: AWS S3 (via `@aws-sdk/client-s3`)
-   **Validation**: Zod
-   **Testing**: Jest, Supertest

## 📂 Project Structure

```
backend/
├── src/
│   ├── config/         # Database and AWS configuration
│   ├── middleware/     # Error handling, validation, logging
│   ├── routes/         # API Route definitions
│   │   ├── wells.js    # File upload/management
│   │   ├── data.js     # Measurement data retrieval
│   │   └── interpret.js# AI interpretation & chat
│   ├── services/       # Business logic
│   │   ├── wellService.js  # DB operations & LAS processing
│   │   ├── lasParser.js    # LAS file parsing logic
│   │   ├── s3Service.js    # AWS S3 file handling
│   │   └── aiService.js    # Claude AI integration
│   └── server.js       # Entry point
├── tests/              # Unit and integration tests
├── .env                # Environment variables
└── package.json        # Dependencies and scripts
```

## ⚙️ Setup & Installation

### 1. Prerequisites

-   Node.js (v18 or higher)
-   PostgreSQL (running locally or cloud)
-   Basic knowledge of SQL

### 2. Installation

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

### 3. Database Setup

Create a PostgreSQL database (e.g., `las_analyzer`) and run the following SQL to create the necessary tables:

```sql
CREATE TABLE wells (
    id UUID PRIMARY KEY,
    filename TEXT NOT NULL,
    s3_key TEXT,
    well_name TEXT,
    field_name TEXT,
    start_depth DOUBLE PRECISION,
    stop_depth DOUBLE PRECISION,
    step DOUBLE PRECISION,
    depth_unit TEXT,
    header_info JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE curves (
    id SERIAL PRIMARY KEY,
    well_id UUID REFERENCES wells(id) ON DELETE CASCADE,
    mnemonic TEXT NOT NULL,
    curve_name TEXT,
    unit TEXT,
    description TEXT,
    min_value DOUBLE PRECISION,
    max_value DOUBLE PRECISION,
    mean_value DOUBLE PRECISION
);

CREATE TABLE measurements (
    id SERIAL PRIMARY KEY,
    curve_id INTEGER REFERENCES curves(id) ON DELETE CASCADE,
    depth DOUBLE PRECISION NOT NULL,
    value DOUBLE PRECISION
);
CREATE INDEX idx_measurements_curve ON measurements(curve_id);
CREATE INDEX idx_measurements_depth ON measurements(depth);

CREATE TABLE interpretations (
    id SERIAL PRIMARY KEY,
    well_id UUID REFERENCES wells(id) ON DELETE CASCADE,
    depth_start DOUBLE PRECISION,
    depth_stop DOUBLE PRECISION,
    curves_analyzed JSONB,
    interpretation_text TEXT,
    statistics JSONB,
    insights JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    well_id UUID REFERENCES wells(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. Environment Variables

Create a `.env` file in the `backend` root:

```env
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/las_analyzer

# AWS S3 (Optional for local dev, but recommended)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your-bucket-name

# Claude API (Required for AI features)
CLAUDE_API_KEY=sk-ant-your-api-key

# Client URL (for CORS)
CORS_ORIGIN=http://localhost:5173
```

## 🏃‍♂️ Running the Server

**Development Mode** (with auto-reload):
```bash
npm run dev
```

**Production Start**:
```bash
npm start
```

The server will start at `http://localhost:3000`.

## 📡 API Endpoints

### Wells
-   `POST /api/wells` - Upload a new LAS file (`multipart/form-data`, field: `file`).
-   `GET /api/wells/:wellId` - Get metadata for a specific well.
-   `GET /api/wells` - List all uploaded wells (if implemented).

### Data
-   `GET /api/wells/:wellId/data` - Get measurement data.
    -   Query Params: `curves` (comma-separated), `depthStart`, `depthStop`.

### AI & Interpretation
-   `POST /api/wells/:wellId/interpret` - Generate AI interpretation for a depth range.
    -   Body: `{ curves: [], depthStart: 1000, depthStop: 1100 }`
-   `POST /api/wells/:wellId/chat` - Chat with the AI about the well.
    -   Body: `{ message: "What does the Gamma Ray log show?", history: [] }`

## 🧪 Testing

Run the test suite:
```bash
npm test
```
