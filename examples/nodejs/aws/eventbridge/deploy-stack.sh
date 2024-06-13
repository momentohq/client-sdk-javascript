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


# Run the deploy script with environment variables
cd infrastructure
npm install
npm run build
npm run deploy -- --parameters MomentoApiKey="$MOMENTO_API_KEY" --parameters MomentoApiEndpoint="$MOMENTO_API_ENDPOINT"

# cd back to the root directory
cd ..

# End
echo "Deployed stack successfully."
