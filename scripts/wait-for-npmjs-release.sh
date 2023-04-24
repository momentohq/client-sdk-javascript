#!/bin/bash

set -x
set -e

usage() {
   echo "Usage: $0 <PACKAGE> <VERSION>"
}

ROOT_DIR="$(dirname "$0")/.."

PACKAGE=${1}
if [ "${PACKAGE}" == "" ]
then
   echo "Missing required argument: PACKAGE"
   usage
   exit 1
fi

VERSION=${2}
if [ "${VERSION}" == "" ]
then
   echo "Missing required argument: VERSION"
   usage
   exit 1
fi

echo "waiting for npm.js availability for package: ${PACKAGE} with version ${VERSION}"

num_attempts=0
seconds_between_retries=120
# 120 seconds * 30 retries = 3600 seconds = 60 minutes
max_num_attempts=30
while true; do
  num_attempts=$((num_attempts+1))
  package_exists_status_code=$(curl -v -o /dev/null -w "%{http_code}" https://registry.npmjs.org/${PACKAGE}/${VERSION})
  echo "Package exists status: ${package_exists_status_code}"
  if [ "${package_exists_status_code}" == "200" ]
  then
    echo "Package found!  Done."
    break
  fi

  echo "Package not found yet."
  if [ "${num_attempts}" -ge $max_num_attempts ]
  then
    echo "Exceeded maximum number of attempts (${max_num_attempts}); aborting."
    exit 1
  fi

  echo "Sleeping 10 seconds before retrying."
  sleep ${seconds_between_retries}
done
