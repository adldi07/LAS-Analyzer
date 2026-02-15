# 🎨 LAS Analyzer Frontend

Welcome to the frontend of the **LAS Well Log Analyzer**, a modern, high-performance web application designed for geologists and petrophysicists to visualize and interpret well logging data.

---

## 🚀 Overview

This application serves as the interactive cockpit for the LAS Analyzer system. It provides a seamless experience for uploading industrial standard `.las` files, visualizing high-density log curves (GR, RHOB, NPHI, etc.), and generating AI-powered petrophysical insights.

### ✨ Key Features
- **Interactive Log Visualization**: High-performance multi-track charts using `Recharts`.
- **Dynamic Depth Scaling**: Zoom and filter specific depth intervals in real-time.
- **AI interpretation Hub**: Integration with LLMs (Claude/GPT) to translate complex curve patterns into geological reports.
- **Responsive Management**: A sleek dashboard to manage multiple wells and their associated metadata.
- **Glassmorphic Design**: A premium, modern UI built with Tailwind CSS for maximum clarity.

---

## 🛠️ Tech Stack

- **Framework**: [React 18](https://reactjs.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **State Management**: React Hooks & Context API
- **HTTP Client**: Axios

---

## 🏁 Getting Started

### 📋 Prerequisites
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- A running instance of the [LAS Backend](../backend/README.md)

### ⚙️ Installation

1. **Enter the directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure the environment**:
   Create a `.env` file in the `frontend` folder:
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   *The application will be available at [http://localhost:5173](http://localhost:5173)*

---

## 📂 Project Structure Highlights

- `src/components/`: Reusable UI components (Buttons, Cards, Modals).
- `src/pages/`: Main application views (Dashboard, Well Details, Upload).
- `src/services/` : API integration and data transformation logic.
- `src/utils/` : Helper functions for unit conversions and parsing.
- `src/styles/` : Global styles and Tailwind configuration.

---

## 📜 Available Scripts

| Script | Purpose |
| :--- | :--- |
| `npm run dev` | Starts the Vite development server with HMR. |
| `npm run build` | Compiles the application into highly optimized static assets for production. |
| `npm run preview` | Locally previews the production build. |
| `npm run lint` | Runs ESLint to check for code quality and style issues. |

---

## 🌐 Production Deployment

For production, the frontend is optimized for deployment on platforms like **Vercel** or **Netlify**. Ensure that your environment variables (like `VITE_API_URL`) point to your production backend (e.g., `https://api.yourdomain.com`).

---

> Built by **Adesh Kumar**
