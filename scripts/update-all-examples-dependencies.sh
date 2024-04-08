#!/bin/bash

set -x
set -e

ROOT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )"/.. &> /dev/null && pwd )

pushd ${ROOT_DIR}/examples
    example_dirs=$(find . -name package.json |grep -v node_modules)
    while IFS= read -r line; do
       example_dir=$(dirname $line)
       echo "DIR: ${example_dir}"
       pushd $example_dir
          has_node_sdk=$(grep '"@gomomento/sdk"' package.json || true)
          if [ "$has_node_sdk" == "" ]
          then
             echo "do not need to upgrade node sdk"
          else
             echo "need to upgrade node sdk"
             npm install @gomomento/sdk
          fi
          has_nodejs_compression=$(grep '"@gomomento/sdk-nodejs-compression"' package.json || true)
          if [ "$has_nodejs_compression" == "" ]
          then
             echo "do not need to upgrade nodejs compression extension"
          else
             echo "need to upgrade nodejs compression extension"
             npm install @gomomento/sdk-nodejs-compression
          fi
          has_web_sdk=$(grep '"@gomomento/sdk-web"' package.json || true)
          if [ "$has_web_sdk" == "" ]
          then
             echo "do not need to upgrade web sdk"
          else
             echo "need to upgrade web sdk"
             npm install @gomomento/sdk-web
          fi
       popd
    done <<< "$example_dirs"
popd
