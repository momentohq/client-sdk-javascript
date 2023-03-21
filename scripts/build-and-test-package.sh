#!/bin/bash

set -x
set -e

echo "building and testing package: ${1}"

./build-package.sh ${1}

pushd ./packages/${1}
    npm run unit-test
    npm run integration-test
popd