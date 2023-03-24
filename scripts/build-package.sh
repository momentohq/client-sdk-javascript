#!/bin/bash

set -x
set -e

echo "building package: ${1}"

pushd ./packages/common
    npm ci
    npm run build
    npm run lint
popd

pushd ./packages/common-integration-tests
    npm ci
    npm run build
    npm run lint
popd

pushd ./packages/${1}
    npm ci
    npm run build
    npm run lint
popd
