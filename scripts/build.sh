#!/bin/bash
rm -r dist;

npx tsc -p tsconfig.node.json && \
npx tsc -p tsconfig.browser.json && \
cp package.json ./dist/node && \
cp package.json ./dist/browser && \
cp src/cli.js dist/browser && \
cp src/cli.js dist/node && \
cp LICENSE.md dist/browser && \
cp LICENSE.md dist/node && \
cp README.md dist/browser && \
cp README.md dist/node && \
cp .npmignore dist/browser && \
cp .npmignore dist/node