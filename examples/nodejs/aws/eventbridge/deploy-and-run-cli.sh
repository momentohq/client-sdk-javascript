#!/bin/bash
set -e
set -x

# Check if .env file exists
if [ ! -f .env ]; then
    echo ".env file not found. See README.md for more information: https://github.com/momentohq/client-sdk-javascript/tree/main/examples/nodejs/aws/eventbridge/webapp/README.md"
    exit 1
fi

# Load environment variables from .env.development file
set -a
source .env
set +a

# Check if environment variables are loaded
if [ -z "$MOMENTO_API_KEY" ] || [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ] || [ -z "$AWS_REGION" ]; then
    echo "Error: Environment variables not loaded from .env file."
    exit 1
fi

if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ] || [ -z "$AWS_REGION" ]; then
    echo "Error: Environment variables not loaded from .env file."
    exit 1
fi

# Run the deploy script with environment variables
cd infrastructure
npm install
npm run build
npm run deploy -- --parameters MomentoApiKey="$MOMENTO_API_KEY" --parameters MomentoApiEndpoint="$MOMENTO_API_ENDPOINT"

# cd back to the root directory
cd ..

# Set your DynamoDB table name
TABLE_NAME="weather-stats-demo"

# Set your item attributes
LOCATION="Phoenix"
MAX_TEMP="80"
MIN_TEMP="60"
PRECIPITATION="90"
TTL="300" # 5 minutes

# Set Momento Cache and Topic Name
CACHE_NAME="momento-eventbridge-cache"
TOPIC_NAME="momento-eventbridge-topic"

## Install Momento CLI
brew tap momentohq/tap
brew install momento-cli
brew upgrade momento-cli

# Configure Momento CLI
momento configure <<EOF
$MOMENTO_API_KEY

EOF

# Use the AWS CLI to put the item into the DynamoDB table
echo "Putting item into DynamoDB table: $TABLE_NAME"
aws dynamodb put-item \
    --table-name $TABLE_NAME \
    --region "$AWS_REGION" \
    --item '{
        "Location": {"S": "'"$LOCATION"'"},
        "MaxTemp": {"N": "'"$MAX_TEMP"'"},
        "MinTemp": {"N": "'"$MIN_TEMP"'"},
        "ChancesOfPrecipitation": {"N": "'"$PRECIPITATION"'"},
        "TTL": {"N": "'"$TTL"'"}
    }'

echo "Item put into DynamoDB table: $TABLE_NAME"

# Get Item From DynamoDB Table
echo "Getting item from DynamoDB table: $TABLE_NAME"
# shellcheck disable=SC2034
dynamodb_output=$(aws dynamodb get-item \
    --table-name "$TABLE_NAME" \
    --region "$AWS_REGION" \
    --key '{
        "Location": {"S": "'"$LOCATION"'"}
    }')

# Get Item From Momento Cache
echo "Getting item from Momento Cache: $CACHE_NAME"
momento cache get --cache $CACHE_NAME $LOCATION

## Delete Item From DynamoDB Table
echo "Deleting item from DynamoDB table: $TABLE_NAME"
aws dynamodb delete-item \
    --table-name $TABLE_NAME \
    --region "$AWS_REGION" \
    --key '{
        "Location": {"S": "'"$LOCATION"'"}
    }'

echo "Item deleted from DynamoDB table: $TABLE_NAME"

# Get Item From DynamoDB Table
echo "Getting item from DynamoDB table: $TABLE_NAME"
# shellcheck disable=SC2034
dynamodb_output=$(aws dynamodb get-item \
    --table-name "$TABLE_NAME" \
    --region "$AWS_REGION" \
    --key '{
        "Location": {"S": "'"$LOCATION"'"}
    }')

# Get Item From Momento Cache
echo "Getting item from Momento Cache: $CACHE_NAME"
momento cache get --cache $CACHE_NAME $LOCATION


