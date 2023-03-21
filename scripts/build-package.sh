#!/bin/bash

set -x
set -e

echo "building package: ${1}"

pushd ./packages/${1}
    npm ci
    npm run build
    npm run lint
    npm run unit-test
    npm run integration-test
popd
