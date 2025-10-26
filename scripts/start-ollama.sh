#!/bin/bash

mkdir -p ~/ollama-models
docker run -d \
  --name ollama \
  -p 11434:11434 \
  -v ~/ollama-models:/root/.ollama/models \
  ollama/ollama:latest