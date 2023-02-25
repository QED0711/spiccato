#!/bin/bash

npm run build;

npm login;

cd ./dist/browser;
npm publish;
