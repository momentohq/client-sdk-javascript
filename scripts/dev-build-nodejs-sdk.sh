#!/bin/bash

set -x
set -e

echo "dev building nodejs sdk"

./packages/build-package.sh "common"
./packages/build-package.sh "client-sdk-nodejs"
