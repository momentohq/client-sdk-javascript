#!/bin/bash

set -x
set -e

ROOT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )"/.. &> /dev/null && pwd )

echo "building package: ${1}"

pushd ${ROOT_DIR}/packages/${1}
    npm ci
    npm run format
    npm run build-without-local-core
    npm run lint
popd
