#!/usr/bin/env bash
set -e
set -x

CURRENT_DIR=${PWD##*/}
if [[ $CURRENT_DIR -ne 'build-scripts' ]]; then
  echo "Please run this script in the build-scripts directory"
  exit 1
fi

if [ "$#" -ne 1 ]; then
    echo "Must pass version as argument to publish the lambda layer"
fi

LAYER_NAME="momento-sdk-nodejs-experimental"
FILENAME="layer.zip"
pushd ..
  if [[ ! -f "${FILENAME}" ]]; then
      echo "${FILENAME} does not exist. Please run ./build-lambda-layer.sh first before trying to publish."
      exit 1
  fi

  LAYER_VERSION=$(aws lambda publish-layer-version \
  --layer-name "${LAYER_NAME}" \
  --description "Lambda layer using Momento sdk version ${1}" \
  --license-info "Apache License 2.0" \
  --zip-file fileb://${FILENAME} \
  --compatible-runtimes nodejs14.x nodejs12.x | jq '.Version')

  aws lambda add-layer-version-permission \
  --layer-name "${LAYER_NAME}" \
  --version-number "${LAYER_VERSION}" \
  --statement-id "version_${1//\./_}" \
  --principal \* \
  --action lambda:GetLayerVersion
popd