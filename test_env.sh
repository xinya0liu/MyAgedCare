#!/bin/bash

echo "Testing environment variables..."

# Load environment variables from .env file
if [ -f .env ]; then
  set -a  # Auto-export all variables
  source .env
  set +a  # Stop auto-export
  echo "Loaded variables from .env file"
else
  echo "Warning: .env file not found!"
fi

# Display Google Maps API key
echo "GOOGLE_MAPS_API_KEY: $GOOGLE_MAPS_API_KEY"

# Use elixir command to check Phoenix configuration
echo "Checking Phoenix configuration..."
cd $(dirname $0) && elixir -e '
  IO.puts("Application config:")
  api_key = Application.get_env(:my_phoenix_app, :google_maps_api_key)
  IO.puts("google_maps_api_key = #{inspect(api_key)}")
' 