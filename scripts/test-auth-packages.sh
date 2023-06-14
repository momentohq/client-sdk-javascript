#!/bin/bash

set -x
set -e

ROOT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )"/.. &> /dev/null && pwd )

echo "running auth testing"

${ROOT_DIR}/scripts/build-package.sh "core"
${ROOT_DIR}/scripts/build-package.sh "common-integration-tests"
${ROOT_DIR}/scripts/build-package.sh "client-sdk-nodejs"
${ROOT_DIR}/scripts/build-package.sh "client-sdk-web"

pushd ${ROOT_DIR}/packages/client-sdk-web
    npm run integration-test-auth
popd

pushd ${ROOT_DIR}/packages/client-sdk-nodejs
    npm run integration-test-auth
popd
