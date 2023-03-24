#!/bin/bash

set -x
set -e

echo "building package: ${1}"

pushd ./packages/${1}
    npm ci
    npm run build
    npm run lint
popd
