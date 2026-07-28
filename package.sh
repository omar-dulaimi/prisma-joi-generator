#!/bin/bash
# Builds the directory that gets published to npm.
#
# `set -euo pipefail` is load-bearing. This used to call a bare `tsc`, so when tsc was not on
# PATH the compile failed, the script carried on, `cp -r lib package/lib` failed too, and it
# printed "Done" and exited 0 having produced a package/ directory with no lib/ in it at all.
set -euo pipefail

START_TIME=$SECONDS
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

echo "Building package..."
rm -rf lib package
# The repo's own TypeScript, not whatever happens to be on PATH.
./node_modules/.bin/tsc
mkdir package

echo "Copying files..."
cp -r lib package/lib
cp package.json README.md LICENSE package

echo "Making package.json public..."
sed -i 's/"private": true/"private": false/' ./package/package.json

# The publishable entry point has to exist, because `npm publish` will happily ship a package
# whose `bin` points at nothing.
test -f package/lib/generator.js
test -f package/lib/prisma-generator.js
test -f package/lib/transformer.js

ELAPSED_TIME=$(($SECONDS - $START_TIME))
echo "Done in $ELAPSED_TIME seconds, $(find package -type f | wc -l) files."
