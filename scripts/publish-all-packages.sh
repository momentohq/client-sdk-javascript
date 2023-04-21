#!/bin/bash

set -x
set -e

ROOT_DIR="$(dirname "$0")/.."

echo "publishing all packages"

${ROOT_DIR}/scripts/publish-package.sh "core"
