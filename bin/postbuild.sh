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

# Export runtime environment variables to .env for backend
echo "USE_AWS=$USE_AWS" >> ./.amplify-hosting/compute/default/.env
echo "REGION=$REGION" >> ./.amplify-hosting/compute/default/.env
echo "DB_HOST=$DB_HOST" >> ./.amplify-hosting/compute/default/.env
echo "DB_PORT=$DB_PORT" >> ./.amplify-hosting/compute/default/.env
echo "DB_USER=$DB_USER" >> ./.amplify-hosting/compute/default/.env
echo "DB_PASS=$DB_PASS" >> ./.amplify-hosting/compute/default/.env
echo "DB_NAME=$DB_NAME" >> ./.amplify-hosting/compute/default/.env
echo "JWT_SECRET=$JWT_SECRET" >> ./.amplify-hosting/compute/default/.env
echo "ACCESS_KEY_ID=$ACCESS_KEY_ID" >> ./.amplify-hosting/compute/default/.env
echo "SECRET_ACCESS_KEY=$SECRET_ACCESS_KEY" >> ./.amplify-hosting/compute/default/.env
echo "BUCKET_NAME=$BUCKET_NAME" >> ./.amplify-hosting/compute/default/.env
echo "BUCKET_REGION=$BUCKET_REGION" >> ./.amplify-hosting/compute/default/.env
echo "PRICECHARTING_TOKEN=$PRICECHARTING_TOKEN" >> ./.amplify-hosting/compute/default/.env
echo "VITE_API_URL=$VITE_API_URL" >> ./.amplify-hosting/compute/default/.env
