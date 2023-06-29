#!/bin/bash

set -x
set -e

echo "dev building web sdk"

./scripts/build-package.sh "core"
./scripts/build-package.sh "common-integration-tests"
./scripts/build-package.sh "client-sdk-web"
