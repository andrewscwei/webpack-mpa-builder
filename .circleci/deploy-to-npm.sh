#!/bin/bash

set -e

echo "//registry.npmjs.org/:_authToken=$NPM_AUTH" >> ~/.npmrc
npm publish
echo "Successfully published to NPM"