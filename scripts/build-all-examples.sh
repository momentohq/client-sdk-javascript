#!/bin/bash

set -e

ROOT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )"/.. &> /dev/null && pwd )

# Array to store built directories to print later
BUILT_DIRECTORIES=()

# Array of directories to exclude from the build as they aren't applicable and mostly related for
# CFN deployments
EXCLUDED_DIRECTORIES=("infrastructure")

# Check if a script is defined in package.json
script_is_defined() {
    local dir="$1"
    local script_name="$2"

    node -e "const pkg = require('${dir}/package.json'); process.exit(pkg.scripts && pkg.scripts['${script_name}'] ? 0 : 1);"
}

# Check if a directory is in the exclusion list
is_excluded() {
    local dir_name="$1"
    for excluded in "${EXCLUDED_DIRECTORIES[@]}"; do
        if [ "${dir_name}" == "${excluded}" ]; then
            return 0 # true
        fi
    done
    return 1 # false
}

# Recursive function to search for package.json
search_for_package_json() {
    local dir="$1"

    # If package.json is found, run commands and don't go deeper
    if [ -f "${dir}/package.json" ]; then
        echo "Building package: $(basename ${dir})"

        pushd ${dir}
            npm ci

            # Check and run scripts if they are defined
            script_is_defined "${dir}" "format" && npm run format
            npm run build
            script_is_defined "${dir}" "lint" && npm run lint
        popd

        # Store the directory
        BUILT_DIRECTORIES+=("${dir}")
    else
        # Else, search deeper in subdirectories
        for subdir in "${dir}"/*; do
            if [ -d "${subdir}" ] && [ "$(basename "${subdir}")" != "node_modules" ] && ! is_excluded "$(basename "${subdir}")"; then
                search_for_package_json "${subdir}"
            fi
        done
    fi
}

# Start the search from the examples directory
search_for_package_json "${ROOT_DIR}/examples"

# Display the built directories at the end
echo "====================="
echo "Directories Built:"
for dir in "${BUILT_DIRECTORIES[@]}"; do
    echo "$dir"
done
