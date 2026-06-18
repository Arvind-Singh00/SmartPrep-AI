#!/bin/sh
# Template script to create a Render service via the Render API.
# You must set RENDER_API_KEY in your environment before running.
# Usage: RENDER_API_KEY=your_key sh render_create_service.sh

if [ -z "$RENDER_API_KEY" ]; then
  echo "Please set RENDER_API_KEY and rerun. Example: RENDER_API_KEY=xxx sh render_create_service.sh"
  exit 1
fi

curl -s -X POST "https://api.render.com/v1/services" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -d '{
    "name": "ai-study-buddy-backend",
    "repo": "https://github.com/Arvind-Singh00/SmartPrep_AI",
    "branch": "main",
    "type": "web",
    "env": "node",
    "plan": "free",
    "autoDeploy": true,
    "buildCommand": "npm install --prefix backend",
    "startCommand": "npm start --prefix backend"
  }'

echo "\nIf the service is created you'll get JSON back; save the "id" field for setting env vars."
