#!/bin/bash

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

set -e
set -x

# Run the webapp
cd cliApp
set +x
echo "MOMENTO_API_KEY=$MOMENTO_API_KEY" > .env
echo "AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID" >> .env
echo "AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY" >> .env
if [ -n "$AWS_SESSION_TOKEN" ]; then
  echo "AWS_SESSION_TOKEN=$AWS_SESSION_TOKEN" >> .env
fi
set -x
echo "AWS_REGION=$AWS_REGION" >> .env

npm install
npm run cli-demo
