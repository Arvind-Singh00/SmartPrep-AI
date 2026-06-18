Deployment (Render backend, Vercel frontend)
===========================================

Backend (Render)
- Connect this GitHub repository to Render and create a Web Service using `render.yaml` or the Render UI.
- In Render, set the environment variables listed in `backend/.env.example` (do NOT commit `.env`).
- Build command: `npm install --prefix backend`
- Start command: `npm start --prefix backend`

Frontend (Vercel)
- Import this repo into Vercel and deploy the root project.
- Build: `npm run build`, Output directory: `dist`.
- Use `vercel.json` for SPA routing.

Let me know if you want me to run the Render API scripts (you'll need to provide an API key) or walk through the UI steps interactively.
