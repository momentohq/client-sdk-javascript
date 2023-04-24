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
    mv package.json package.json.ORIG
    # We need to update the version number of the package itself; Also, if it has a dependency on @gomomento/core, then
    # we need to update that dependency version too.
    cat package.json.ORIG | \
      jq ". += {\"version\": \"${VERSION}\"} | if .dependencies.\"@gomomento/core\"? then .dependencies.\"@gomomento/core\"=\"${VERSION}\" else . end" \
      > package.json
    echo ""
    echo "New package.json:"
    cat package.json
    echo ""
    npm ci
    npm run build
    npm run lint
    npm run test

    npm publish --access public
popd
