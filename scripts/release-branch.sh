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

yarn version --new-version $NEW_VERSION --no-git-tag-version

VERSION=$(node -p -e "require('./package.json').version")

git checkout -b "$VERSION"
git add .
git commit -m "v$VERSION"

git tag -a "v$VERSION" -m "v$VERSION"

git push origin "$VERSION" --follow-tags

git checkout master
