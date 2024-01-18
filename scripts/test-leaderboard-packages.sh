#!/bin/bash

set -x
set -e

ROOT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )"/.. &> /dev/null && pwd )

echo "running leaderboard tests"

pushd ${ROOT_DIR}/packages/client-sdk-web
    npm run integration-test-leaderboard
popd

pushd ${ROOT_DIR}/packages/client-sdk-nodejs
    npm run integration-test-leaderboard
popd
