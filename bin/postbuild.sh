#!/usr/bin/env bash
set -e

# Clean previous build bundle
rm -rf ./.amplify-hosting
mkdir -p ./.amplify-hosting/compute/default
mkdir -p ./.amplify-hosting/static

# Copy backend code + dependencies
cp -r backend/* ./.amplify-hosting/compute/default/

# Copy frontend build output (just the contents of /dist, not the folder itself)
cp -r frontend/dist/* ./.amplify-hosting/static/

# Copy routing manifest
cp deploy-manifest.json ./.amplify-hosting/deploy-manifest.json
