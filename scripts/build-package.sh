#!/bin/bash

set -x
set -e

ROOT_DIR="$(dirname "$0")/.."

echo "building package: ${1}"

pushd ${ROOT_DIR}/packages/${1}
    npm ci
    npm run build
    npm run lint
popd
