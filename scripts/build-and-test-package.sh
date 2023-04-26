#!/bin/bash

set -x
set -e


ROOT_DIR="$(dirname "$0")/.."

echo "building and testing package: ${1}"

${ROOT_DIR}/scripts/build-package.sh ${1}

pushd ${ROOT_DIR}/packages/${1}
    npx jest --maxWorkers 1
    #npm run unit-test
    #npm run integration-test
popd
