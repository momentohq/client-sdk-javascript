#!/usr/bin/env bash
set -e
set -x

CURRENT_DIR=${PWD##*/}
if [[ $CURRENT_DIR -ne 'build-scripts' ]]; then
  echo "Please run this script in the build-scripts directory"
  exit 1
fi

pushd ..
  mkdir -p nodejs/node_modules
  pushd nodejs/node_modules
    npm i @gomomento/sdk
  popd
  zip -r layer.zip nodejs
popd