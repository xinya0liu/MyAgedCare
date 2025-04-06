#!/bin/bash

# Terminate any running Phoenix server processes
echo "Terminating any running Phoenix server..."
pkill -f "phx.server" || true

# Load environment variables
echo "Loading environment variables from .env file..."
if [ -f .env ]; then
  # Directly load environment variables into current shell
  set -a
  source .env
  set +a
  echo "Using Google Maps API Key: $GOOGLE_MAPS_API_KEY"
else
  echo "Warning: .env file not found!"
fi

# Clean build files
echo "Cleaning build files..."
mix deps.get
mix compile

# Start Phoenix server
echo "Starting Phoenix server..."
mix phx.server 