#!/bin/bash

set -x
set -e

echo "dev building nodejs sdk for aws lambda"

./scripts/build-package-lambda.sh "common-integration-tests"
./scripts/build-package-lambda.sh "client-sdk-nodejs"
