#!/bin/bash

set -x
set -e

ROOT_DIR="$(dirname "$0")/.."

echo "building all packages"

${ROOT_DIR}/scripts/build-package.sh "core"
${ROOT_DIR}/scripts/build-package.sh "common-integration-tests"
${ROOT_DIR}/scripts/build-package.sh "client-sdk-nodejs"
${ROOT_DIR}/scripts/build-package.sh "client-sdk-web"
