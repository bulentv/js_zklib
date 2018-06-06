#!/bin/bash

set -ex

while [[ $# > 1 ]]
do
key="$1"

case $key in
  -v|--new-version)
  NEW_VERSION="$2"
  shift
  ;;
  *)
  # unknown option
  ;;
esac
shift
done

NEW_VERSION="${NEW_VERSION:-"patch"}"

echo NEW_VERSION = "${NEW_VERSION}"

yarn version --new-version $NEW_VERSION

VERSION=$(node -p -e "require('./package.json').version")

git checkout -b "$VERSION"
git push origin "$VERSION" --follow-tags

git checkout master
