#!/bin/bash

set -x
set -e

ROOT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )"/.. &> /dev/null && pwd )

echo "dev building web sdk"

${ROOT_DIR}/scripts/build-and-test-package.sh "core"
${ROOT_DIR}/scripts/build-and-test-package.sh "common-integration-tests"
${ROOT_DIR}/scripts/build-and-test-package.sh "client-sdk-nodejs"
${ROOT_DIR}/scripts/build-and-test-package.sh "client-sdk-nodejs-compression"
${ROOT_DIR}/scripts/build-and-test-package.sh "client-sdk-web"
