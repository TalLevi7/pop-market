#!/usr/bin/env bash
set -e

# Clean previous build bundle
rm -rf ./.amplify-hosting
mkdir -p ./.amplify-hosting/compute/default

# Copy backend code + dependencies
cp -r backend/* ./.amplify-hosting/compute/default/

# Copy frontend build output
cp -r frontend/dist ./.amplify-hosting/static

# Copy routing manifest
cp deploy-manifest.json ./.amplify-hosting/deploy-manifest.json
