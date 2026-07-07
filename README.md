# 🎯 SmartPrep AI

> **RAG-powered AI study assistant** — Upload your notes, chat with your documents, generate quizzes, and create flashcards instantly.

![SmartPrep AI](https://img.shields.io/badge/SmartPrep-AI%20Powered-black?style=for-the-badge&logo=google)
![React](https://img.shields.io/badge/React-Vite-61DAFB?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)
![Gemini](https://img.shields.io/badge/Google-Gemini-4285F4?style=for-the-badge&logo=google)
![Groq](https://img.shields.io/badge/Groq-LLaMA%203.3-orange?style=for-the-badge)

---

## ✨ Features

- 📄 **Document Management** — Upload PDF notes (up to 10MB) to your personal library
- 💬 **RAG-Powered Chat** — Ask questions about your notes and get context-aware answers with exact citations from your document
- 🧠 **Auto-Generated Quizzes** — Dynamically generate multiple-choice quizzes with explanations based on your PDF content
- 🃏 **Flashcard Decks** — Automatically extract key concepts from your notes into ready-to-study flashcards
- 📊 **Dynamic Dashboard** — Track your study streak, total quizzes taken, and average scores
- ⚡ **Split AI Architecture** — Google Gemini for OCR & embeddings + Groq (LLaMA 3.3 70B) for chat & generation, effectively eliminating standard AI free-tier quota limits

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React.js (Vite), Tailwind CSS, Zustand, Framer Motion |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas (Mongoose) |
| **AI — Embeddings & OCR** | Google Gemini (Gen AI SDK) |
| **AI — Chat & Generation** | Groq SDK (LLaMA 3.3 70B Versatile) |

---

## 📁 Project Structure

```
SmartPrep-AI/
├── src/                     # React frontend source
│   ├── components/          # Reusable UI components
│   ├── pages/               # Dashboard, Chat, Quiz, Flashcards
│   └── store/               # Zustand state management
├── backend/                 # Express backend
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # API routes
│   │   └── services/        # Gemini & Groq AI services
│   └── package.json
├── Prompts/                 # AI prompt templates
├── index.html
├── vite.config.js
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- Google Gemini API key
- Groq API key

### 1. Clone the repository
```bash
git clone https://github.com/Arvind-Singh00/SmartPrep-AI.git
cd SmartPrep-AI
```

### 2. Setup Backend
```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:
```env
PORT=5000
MONGODB_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_google_gemini_api_key
GROQ_API_KEY=your_groq_api_key
```

```bash
npm run dev
```

### 3. Setup Frontend
```bash
# Go back to root
cd ..
npm install
```

Create a `.env` file in the root:
```env
VITE_SERVER_URL=http://localhost:5000
```

```bash
npm run dev
```

---

## 🧠 How RAG Works

```
User uploads PDF
      ↓
Gemini extracts & chunks text → generates embeddings
      ↓
Stored in MongoDB as vector chunks
      ↓
User asks a question
      ↓
Relevant chunks retrieved (semantic search)
      ↓
Groq LLaMA 3.3 generates answer with citations
      ↓
Answer returned to user ✅
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register user |
| `POST` | `/api/auth/login` | Login user |
| `POST` | `/api/documents/upload` | Upload PDF |
| `GET` | `/api/documents` | Get all documents |
| `POST` | `/api/chat` | RAG-powered chat with document |
| `POST` | `/api/quiz/generate` | Generate quiz from document |
| `POST` | `/api/flashcards/generate` | Generate flashcards from document |
| `GET` | `/api/dashboard` | Get study stats & streak |

---

## 🌐 Deployment

### Backend — Web Service (Render)
| Setting | Value |
|---|---|
| Root Directory | `backend` |
| Build Command | `npm install` |
| Start Command | `npm start` |

### Frontend — Static Site (Render / Vercel)
| Setting | Value |
|---|---|
| Root Directory | `.` (root) |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |

---

## 📄 License

MIT © [Arvind Singh](https://github.com/Arvind-Singh00)
