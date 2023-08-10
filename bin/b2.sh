#!/bin/bash
#
version_type=$(echo $@ | grep -oP '(?<=--bump )([^ $]+)')
npm_arguments=$(echo $@ | grep -oP '(?<=--npm-args )([^$]+)')

VERSION_TYPES=(
  patch
  minor
  major
)

function publish() {
  ls -1 packages | \
    xargs -I{} sh -c "cd dist/{} && npm publish --access=public" $npm_arguments
}

function build() {
  tsc
  test -f tsconfig.esm.json && tsc -p tsconfig.esm.json

  for package in $(ls -1 packages); do
    mkdir -p "dist/${package}"

    for mode in esm cjs; do
      test -f "dist/${mode}" || continue
      cp -r "dist/${mode}/${package}" "dist/${package}/${mode}"
      test -e "dist/${package}/${mode}/node_modules" \
        || ln -s $(realpath "packages/${package}/node_modules") "dist/${package}/${mode}/node_modules"
    done

    if ! [ -z "$version_type" ]; then
      (cd "packages/${package}" && npm version "$version_type")
    fi

    cp "packages/${package}/package.json" "dist/${package}/package.json"
    echo '{"type": "module"}' | jq > "dist/${package}/esm/package.json"
    echo '{"type": "commonjs"}' | jq > "dist/${package}/cjs/package.json"
  done
}

function move_assets() {
  for mode in esm cjs; do
    cp -r packages/api/presets "dist/api/${mode}/presets"
  done
}

function cleanup() {
  rm -rf dist
}

function main() {
  set -x
  cleanup
  build
  move_assets

  if ! [ -z "$version_type" ]; then
    if ! [[ "${VERSION_TYPES[*]}" =~ "$version_type" ]]; then
      echo "$0 ${VERSION_TYPES[*]}"
      exit
    fi

    publish
  fi
}

main
