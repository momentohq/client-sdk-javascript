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

ROOT_DIR="$(dirname "$0")/.."

echo "publishing all packages"

${ROOT_DIR}/scripts/publish-package.sh "core" "${CORE_VERSION}" "${CORE_VERSION}"
${ROOT_DIR}/scripts/wait-for-npmjs-release.sh "@gomomento/sdk-core" "${VERSION}"
${ROOT_DIR}/scripts/update-package-versions.sh "common-integration-tests" "${VERSION}" "${CORE_VERSION}"
${ROOT_DIR}/scripts/publish-package.sh "client-sdk-nodejs" "${VERSION}" "${CORE_VERSION}"

# We plan to version the web SDK along with the node.js SDK and core library for the time
# being, just to keep things simple.
# Until we are ready for a 1.x release of the web sdk, we use this silly hack to replace
# the leading `1.` in the version number with a `0.`, to make it clear that we are pre-`1.0`.
# We will remove this line when we are ready to officially release the web sdk.
WEB_SDK_VERSION=$(echo ${VERSION} |sed "s/^1\./0\./")
${ROOT_DIR}/scripts/publish-package.sh "client-sdk-web" "${WEB_SDK_VERSION}" "${CORE_VERSION}"
