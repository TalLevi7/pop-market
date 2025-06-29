#!/usr/bin/env bash
rm -rf ./.amplify-hosting
mkdir -p ./.amplify-hosting/compute/default
cd backend
npm ci
# Copy backend
cp -r backend/* ./.amplify-hosting/compute/default/
cp -r backend/node_modules ./.amplify-hosting/compute/default/node_modules
# Copy frontend build
cp -r frontend/dist ./.amplify-hosting/static
# Copy manifest
cp deploy-manifest.json ./.amplify-hosting/deploy-manifest.json
