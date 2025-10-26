#!/bin/bash

docker network create zignet-net

docker run -d --name open-webui \
  --network zignet-net \
  -p 3000:8080 \
  -e OLLAMA_BASE_URL=http://ollama:11434 \
  -v open-webui:/app/backend/data \
  ghcr.io/open-webui/open-webui:latest