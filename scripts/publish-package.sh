#!/bin/bash

set -x
set -e

usage() {
   echo "Usage: $0 <PACKAGE> <VERSION> <CORE_VERSION>"
}

ROOT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )"/.. &> /dev/null && pwd )

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

${ROOT_DIR}/scripts/update-package-versions.sh ${PACKAGE} ${VERSION} ${CORE_VERSION}

echo "publishing package: ${PACKAGE} with version ${VERSION} (core version: ${CORE_VERSION})"

pushd ${ROOT_DIR}/packages/${PACKAGE}
    npm publish --access public
popd
