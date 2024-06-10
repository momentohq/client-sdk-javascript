#!/bin/bash
set -e
set -x

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

# Subscribe to topic
echo "Subscribing to topic..."
momento topic subscribe $TOPIC_NAME --cache $CACHE_NAME
