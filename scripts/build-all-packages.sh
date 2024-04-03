#!/bin/bash

set -x
set -e

ROOT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )"/.. &> /dev/null && pwd )

echo "building all packages"

${ROOT_DIR}/scripts/build-package.sh "core"
${ROOT_DIR}/scripts/build-package.sh "common-integration-tests"
${ROOT_DIR}/scripts/build-package.sh "client-sdk-nodejs"
${ROOT_DIR}/scripts/build-package.sh "client-sdk-nodejs-compression"
${ROOT_DIR}/scripts/build-package.sh "client-sdk-web"
