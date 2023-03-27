#!/bin/bash

set -x
set -e

echo "building package: ${1}"

pushd ./packages/${1}
    # this is a bit hacky, but allows us to build on github consistently. Without the `-f`
    # we were getting flaky github build errors `npm ERR! code EEXIST`, I believe it has to
    # do with building the common packages first, and then installing them into each of
    # the sdks. Ideally we shouldn't have to use the `-f` flag, but using it to unblock us
    npm ci -f
    npm run build
    npm run lint
popd
