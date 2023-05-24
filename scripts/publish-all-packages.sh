#!/bin/bash

set -x
set -e

usage() {
   echo "Usage: $0 <VERSION>"
}

VERSION=${1}
if [ "${VERSION}" == "" ]
then
   echo "Missing required argument: VERSION"
   usage
   exit 1
fi
CORE_VERSION=$VERSION

ROOT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )"/.. &> /dev/null && pwd )

echo "publishing all packages"

${ROOT_DIR}/scripts/publish-package.sh "core" "${CORE_VERSION}" "${CORE_VERSION}"
${ROOT_DIR}/scripts/wait-for-npmjs-release.sh "@gomomento/sdk-core" "${VERSION}"
${ROOT_DIR}/scripts/update-package-versions.sh "common-integration-tests" "${VERSION}" "${CORE_VERSION}"
pushd ${ROOT_DIR}/packages/common-integration-tests
  npm pack
popd
${ROOT_DIR}/scripts/publish-package.sh "client-sdk-nodejs" "${VERSION}" "${CORE_VERSION}"
${ROOT_DIR}/scripts/publish-package.sh "client-sdk-web" "${VERSION}" "${CORE_VERSION}"
