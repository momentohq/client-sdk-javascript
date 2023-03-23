#!/bin/bash

set -x
set -e

echo "building package: ${1}"

pushd ./packages/${1}
    npm ci
    # this is gross, but npm will fail to import things
    # during local builds of files in common if it doesn't
    # find a node_modules directory there.
    ln -s $(pwd)/node_modules ../common/node_modules
    npm run build
    npm run lint
popd
