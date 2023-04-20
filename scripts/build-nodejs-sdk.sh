#!/bin/bash

set -x
set -e

echo "dev building web sdk"

./scripts/build-package.sh "common"
./scripts/build-package.sh "client-sdk-nodejs"
