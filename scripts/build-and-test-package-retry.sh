#!/bin/bash

set -x
set -e

ROOT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )"/.. &> /dev/null && pwd )

echo "building and testing retry with full network outage"

${ROOT_DIR}/scripts/build-and-test-package-full-network-outage-retry-tests.sh "client-sdk-nodejs"
#${ROOT_DIR}/scripts/build-and-test-package-temporary-network-outage-retry-tests.sh "client-sdk-nodejs"
