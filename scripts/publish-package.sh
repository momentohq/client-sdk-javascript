#!/bin/bash

set -x
set -e

usage() {
   echo "Usage: $0 <PACKAGE> <VERSION> <CORE_VERSION>"
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

CORE_VERSION=${3}
if [ "${CORE_VERSION}" == "" ]
then
   echo "Missing required argument: CORE_VERSION"
   usage
   exit 1
fi

echo "publishing package: ${PACKAGE} with version ${VERSION} (core version: ${CORE_VERSION})"

pushd ${ROOT_DIR}/packages/${PACKAGE}
    mv package.json package.json.ORIG
    # We need to update the version number of the package itself; Also, if it has a dependency on @gomomento/sdk-core, then
    # we need to update that dependency version too.
    cat package.json.ORIG | \
      jq ". += {\"version\": \"${VERSION}\"}" \
      > package.json
    has_dependency_on_core=$(cat package.json|jq '.dependencies."@gomomento/sdk-core" != null')
    if [ "${has_dependency_on_core}" == "true" ];
    then
      npm uninstall @gomomento/sdk-core
      npm install -E @gomomento/sdk-core@${CORE_VERSION}
    fi
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
