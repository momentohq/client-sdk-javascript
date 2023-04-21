#!/bin/bash

set -x
set -e

usage() {
   echo "Usage: $0 <VERSION>"
}

VERSION=${1}
if [ "${VERSION}" == "" ];
   echo "Missing required argument: VERSION"
   usage
   exit 1
fi

ROOT_DIR="$(dirname "$0")/.."

echo "publishing all packages"

${ROOT_DIR}/scripts/publish-package.sh "core" "${VERSION}"
