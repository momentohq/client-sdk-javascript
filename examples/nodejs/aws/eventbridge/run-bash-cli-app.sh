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

echo "Script execution completed."
