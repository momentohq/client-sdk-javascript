#!/usr/bin/env bash

set -e
set -x

DEV_TOKEN=$1
if [ "$DEV_TOKEN" == "" ]
then
  echo "Missing required argument: dev token"
  echo "Usage: $0 <dev token>"
  exit 1
fi

echo "{\"endpoint\":\"localhost\",\"api_key\":\"${DEV_TOKEN}\"}" |base64
