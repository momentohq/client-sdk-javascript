#!/bin/bash
set -e
set -x

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found."
    echo "Please create a .env file in the root directory."
    echo "Refer to the documentation for more information: https://github.com/momentohq/client-sdk-javascript/tree/main/examples/nodejs/aws/eventbridge"
    exit 1
fi

# Load environment variables from .env file
set -a
source .env
set +a

# Check if Momento environment variables are loaded
if [ -z "$MOMENTO_API_KEY" ] || [ -z "$MOMENTO_API_ENDPOINT" ]; then
    echo "Error: Required Momento environment variables are not set."
    echo "Please ensure the following variables are set in your .env file:"
    echo "  - MOMENTO_API_KEY"
    echo "  - MOMENTO_API_ENDPOINT"
    exit 1
fi

# Check if AWS environment variables are loaded
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ] || [ -z "$AWS_REGION" ]; then
    echo "Error: Required AWS environment variables are not set."
    echo "Please ensure the following variables are set in your .env file:"
    echo "  - AWS_ACCESS_KEY_ID"
    echo "  - AWS_SECRET_ACCESS_KEY"
    echo "  - AWS_REGION"
    exit 1
fi

# Run the webapp
cd webapp
echo "VITE_MOMENTO_API_KEY=$MOMENTO_API_KEY" > .env.development
echo "VITE_AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID" >> .env.development
echo "VITE_AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY" >> .env.development
if [ -n "$AWS_SESSION_TOKEN" ]; then
  echo "VITE_AWS_SESSION_TOKEN=$AWS_SESSION_TOKEN" >> .env.development
fi
echo "VITE_AWS_REGION=$AWS_REGION" >> .env.development


npm install
npm run dev
