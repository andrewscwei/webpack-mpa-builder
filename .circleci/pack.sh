#!/bin/bash

set -e

source .circleci/get-opts.sh

mkdir build
npm pack
mv $PACKAGE_FILE.tgz build/