# Deployment notes

Backend (Render)

- Link this GitHub repository to Render and enable auto-deploy from the `main` branch.
- Render will use `render.yaml` to create a Node Web Service named `ai-study-buddy-backend`.
- In Render dashboard, set the required environment variables (for example `MONGODB_URI`, `JWT_SECRET`, any API keys). Do NOT commit secrets to the repository.
- Render uses the build command `npm install --prefix backend` and start command `npm start --prefix backend`.

Frontend (Vercel)

- Import this GitHub repository in Vercel and deploy the root project.
- Vercel will run `npm run build` and deploy the `dist` directory. `vercel.json` configures the static build and SPA routing.
- If you use environment variables for the frontend, add them in the Vercel project settings.

Notes

- Ensure `backend/.env` is not committed (it is ignored via `.gitignore`).
- If you need help configuring specific environment variables, tell me which secrets you use and I can create a template file `backend/.env.example`.
