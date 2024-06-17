#!/bin/bash
set -e
set -x

# Set Momento Cache and Topic Name
CACHE_NAME="momento-eventbridge-cache"
TOPIC_NAME="momento-eventbridge-topic"

# Subscribe to topic
echo "Subscribing to topic..."
momento topic subscribe $TOPIC_NAME --cache $CACHE_NAME
