#!/bin/bash

# Check if .env file exists
if [ ! -f .env ]; then
    echo ".env file not found."
    exit 1
fi

# Load environment variables from .env file
set -a
source .env
set +a

# Check if environment variables are loaded
if [ -z "$MOMENTO_API_KEY" ] || [ -z "$MOMENTO_API_ENDPOINT" ]; then
    echo "Error: Environment variables not loaded from .env file."
    exit 1
fi

# Run the deploy script with environment variables
cd infrastructure && npm install && npm run build && npm run deploy -- --parameters MomentoApiKey="$MOMENTO_API_KEY" --parameters MomentoApiEndpoint="$MOMENTO_API_ENDPOINT"

# cd back to the root directory
cd ..

# Run the webapp
cd webapp && echo "VITE_MOMENTO_API_KEY=$MOMENTO_API_KEY" > .env.development && echo "VITE_AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID" >> .env.development && echo "VITE_AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY" >> .env.development && [ -n "$AWS_SESSION_TOKEN" ] && echo "VITE_AWS_SESSION_TOKEN=$AWS_SESSION_TOKEN" >> .env.development
npm install && npm run dev
