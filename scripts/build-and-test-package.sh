#!/bin/bash

set -x
set -e

ROOT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )"/.. &> /dev/null && pwd )

echo "building and testing package: ${1}"

${ROOT_DIR}/scripts/build-package.sh ${1}

pushd ${ROOT_DIR}/packages/${1}
    npm run unit-test
    npm run integration-test
popd
