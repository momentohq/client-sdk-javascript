#!/bin/bash

set -x
set -e

ROOT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )"/.. &> /dev/null && pwd )

echo "building and testing JS SDK with consistent reads"

${ROOT_DIR}/scripts/build-and-test-package-consistent-reads.sh "core"
${ROOT_DIR}/scripts/build-and-test-package-consistent-reads.sh "common-integration-tests"
${ROOT_DIR}/scripts/build-and-test-package-consistent-reads.sh "client-sdk-nodejs"
${ROOT_DIR}/scripts/build-and-test-package-consistent-reads.sh "client-sdk-nodejs-compression"
${ROOT_DIR}/scripts/build-and-test-package-consistent-reads.sh "client-sdk-nodejs-compression-zstd"
${ROOT_DIR}/scripts/build-and-test-package-consistent-reads.sh "client-sdk-web"
#${ROOT_DIR}/scripts/build-and-test-package-full-network-outage-retry-tests.sh "client-sdk-nodejs"
#${ROOT_DIR}/scripts/build-and-test-package-temporary-network-outage-retry-tests.sh "client-sdk-nodejs"
