#!/bin/bash

set -x
set -e

ROOT_DIR="$(dirname "$0")/.."

echo "dev building web sdk"

${ROOT_DIR}/scripts/build-and-test-package.sh "core"
${ROOT_DIR}/scripts/build-and-test-package.sh "common-integration-tests"
${ROOT_DIR}/scripts/build-and-test-package.sh "client-sdk-nodejs"
${ROOT_DIR}/scripts/build-and-test-package.sh "client-sdk-web"
