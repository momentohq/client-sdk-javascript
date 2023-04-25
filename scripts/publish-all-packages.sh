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

ROOT_DIR="$(dirname "$0")/.."

echo "publishing all packages"

${ROOT_DIR}/scripts/publish-package.sh "core" "${VERSION}"
${ROOT_DIR}/scripts/wait-for-npmjs-release.sh "@gomomento/core" "${VERSION}"
${ROOT_DIR}/scripts/build-package.sh "common-integration-tests"
${ROOT_DIR}/scripts/publish-package.sh "client-sdk-nodejs" "${VERSION}"

# We plan to version the web SDK along with the node.js SDK and core library for the time
# being, just to keep things simple.
# Until we are ready for a 1.x release of the web sdk, we use this silly hack to replace
# the leading `1.` in the version number with a `0.`, to make it clear that we are pre-`1.0`.
# We will remove this line when we are ready to officially release the web sdk.
WEB_SDK_VERSION=$(echo ${VERSION} |sed "s/^1\./0\./")
echo "This is a dry run, but otherwise I would now be attempting to publish web SDK version ${WEB_SDK_VERSION}"
#${ROOT_DIR}/scripts/publish-package.sh "client-sdk-web" "${WEB_SDK_VERSION}"
