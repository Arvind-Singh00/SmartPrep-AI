#!/bin/sh
# Template to set an environment variable on an existing Render service.
# Requires: RENDER_API_KEY and RENDER_SERVICE_ID
# Usage: RENDER_API_KEY=xxx RENDER_SERVICE_ID=svc_xxx sh render_set_env.sh

if [ -z "$RENDER_API_KEY" ] || [ -z "$RENDER_SERVICE_ID" ]; then
  echo "Please set RENDER_API_KEY and RENDER_SERVICE_ID. Example: RENDER_API_KEY=xxx RENDER_SERVICE_ID=svc_xxx sh render_set_env.sh"
  exit 1
fi

KEY="MONGODB_URI"
VALUE="mongodb+srv://<user>:<pass>@cluster0.mongodb.net/dbname"

curl -s -X POST "https://api.render.com/v1/services/$RENDER_SERVICE_ID/env-vars" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -d "{ \"key\": \"$KEY\", \"value\": \"$VALUE\", \"secure\": true }"

echo "\nIf successful, the env var will be set for the service."
