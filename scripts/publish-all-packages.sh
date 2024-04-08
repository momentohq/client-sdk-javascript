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

# We plan to version the node.js compression extensions along with the node.js SDK and core library for the time
# being, just to keep things simple.
# Until we are ready for a 1.x release of the compression extensions, we use this silly hack to replace
# the leading `1.` in the version number with a `0.`, to make it clear that we are pre-`1.0`.
# We will remove this line when we are ready to officially release the compression extensions.
NODEJS_COMPRESSION_EXTENSIONS_VERSION=$(echo ${VERSION} |sed "s/^1\./0\./")

ROOT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )"/.. &> /dev/null && pwd )

echo "publishing all packages"

${ROOT_DIR}/scripts/publish-package.sh "core" "${CORE_VERSION}" "${CORE_VERSION}"
${ROOT_DIR}/scripts/wait-for-npmjs-release.sh "@gomomento/sdk-core" "${VERSION}"
${ROOT_DIR}/scripts/update-package-versions.sh "common-integration-tests" "${VERSION}" "${CORE_VERSION}"
pushd ${ROOT_DIR}/packages/common-integration-tests
  npm pack
popd
${ROOT_DIR}/scripts/publish-package.sh "client-sdk-nodejs" "${VERSION}" "${CORE_VERSION}"
# The compression library has a dependency on the nodejs package, so we need to wait for it to release
# before attempting to publish the compression package
${ROOT_DIR}/scripts/wait-for-npmjs-release.sh "@gomomento/sdk" "${VERSION}"

${ROOT_DIR}/scripts/publish-package.sh "client-sdk-nodejs-compression" "${NODEJS_COMPRESSION_EXTENSIONS_VERSION}" "${CORE_VERSION}"

${ROOT_DIR}/scripts/publish-package.sh "client-sdk-web" "${VERSION}" "${CORE_VERSION}"
