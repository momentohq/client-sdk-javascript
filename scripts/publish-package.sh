#!/bin/bash

set -x
set -e

usage() {
   echo "Usage: $0 <PACKAGE> <VERSION>"
}

ROOT_DIR="$(dirname "$0")/.."

PACKAGE=${1}
if [ "${PACKAGE}" == "" ]
then
   echo "Missing required argument: PACKAGE"
   usage
   exit 1
fi

VERSION=${2}
if [ "${VERSION}" == "" ]
then
   echo "Missing required argument: VERSION"
   usage
   exit 1
fi

echo "publishing package: ${PACKAGE} with version ${VERSION}"

pushd ${ROOT_DIR}/packages/${PACKAGE}
    npm ci
    npm run build
    npm run lint
    npm run test
    mv package.json package.json.ORIG
    cat package.json.ORIG |jq ". += {\"version\": \"${VERSION}\"}" > package.json
    npm publish --access public
popd
