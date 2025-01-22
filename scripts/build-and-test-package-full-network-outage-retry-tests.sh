#!/bin/bash

set -x
set -e

ROOT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )"/.. &> /dev/null && pwd )

echo "building and testing JS SDK with full network outage"

${ROOT_DIR}/scripts/build-package.sh "core"
${ROOT_DIR}/scripts/build-package.sh "common-integration-tests"
${ROOT_DIR}/scripts/build-package.sh "client-sdk-nodejs"

echo "building and testing retry with full network outage"
echo "Target URL for tests: ${TEST_URL}"

pushd ${ROOT_DIR}/packages/client-sdk-nodejs
    TEST_URL=${TEST_URL} npm run integration-test-retry-full-network-outage
popd
