#!/bin/bash

set -x
set -e

ROOT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )"/.. &> /dev/null && pwd )

echo "Building and testing package: ${1}"
echo "Target URL for tests: ${TEST_URL}"

${ROOT_DIR}/scripts/build-package.sh ${1}

pushd ${ROOT_DIR}/packages/${1}
    npm run unit-test
    TEST_URL=${TEST_URL} npm run integration-test-retry-temporary-network-outage
popd



##!/bin/bash
#
#set -x
#set -e
#
#ROOT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )"/.. &> /dev/null && pwd )
#
#echo "Building and testing package: ${1}"
#
## Start the Docker container in the background
#DOCKER_CONTAINER_NAME="momento-local-test"
#docker run --name ${DOCKER_CONTAINER_NAME} -d -p 8080:8080 gomomento/momento-local \
#    --return-error unavailable --error-rpcs get --error-count 2
#
## Ensure the container is stopped when the script exits
#function cleanup {
#    echo "Stopping and removing Docker container..."
#    docker stop ${DOCKER_CONTAINER_NAME}
#    docker rm ${DOCKER_CONTAINER_NAME}
#}
#trap cleanup EXIT
#
#${ROOT_DIR}/scripts/build-package.sh ${1}
#
#pushd ${ROOT_DIR}/packages/${1}
#    npm run integration-test-retry-temporary-network-outage
#popd
