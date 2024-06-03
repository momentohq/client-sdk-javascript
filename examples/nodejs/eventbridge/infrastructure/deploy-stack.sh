#!/usr/bin/env bash

set -e
set -x
set -o pipefail

npm i
npm run build

export AWS_PROFILE=dev
export AWS_REGION=us-west-2

rm -f cdk.context.json
npm ci

npx cdk deploy "eventbridge-stack" --require-approval never --debug --verbose
