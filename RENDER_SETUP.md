# Connecting this repository to Render

1. Create a Render account and obtain an API key (Dashboard → Account → API Keys).

2. To create the service from the repo automatically, either:
   - Use the Render web UI: Dashboard → New → Web Service → Connect GitHub → select `SmartPrep_AI` → set build/start commands shown in `render.yaml`.
   - Or run the included template script (requires `RENDER_API_KEY`):

```
RENDER_API_KEY=your_key sh render_create_service.sh
```

The script will return JSON including the `id` of the created service. Save that `id` for the next step.

3. Set environment variables (in the Render UI or via API). Example using the provided script:

```
RENDER_API_KEY=your_key RENDER_SERVICE_ID=svc_xxx sh render_set_env.sh
```

Replace `svc_xxx` with the service id returned by the create script or visible in the Render dashboard. For production you should add at least:

- `MONGODB_URI`
- `JWT_SECRET`
- `OPENAI_API_KEY` (or any other AI provider keys)

4. After environment variables are set Render will auto-deploy (if `autoDeploy` is enabled) or you can trigger a manual deploy from the dashboard.

Security notes:

- Never commit `.env` or secrets to the repo. Use `backend/.env.example` as a template.
- The scripts are templates — confirm API endpoints and payloads against Render's API docs before running. If your Render API differs, prefer the web UI.
