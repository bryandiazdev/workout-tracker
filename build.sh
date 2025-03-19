#!/bin/bash

# Navigate to client directory
cd WorkoutTracker.Client

# Install dependencies
npm install

# Build the app
npm run build

# Create API directory at root if it doesn't exist
mkdir -p ../api

# Copy API functions from client directory to root api directory
if [ -d "api" ]; then
  echo "Copying API functions from client to root..."
  cp -rf api/* ../api/
fi

# Ensure the root API files take precedence
echo "Ensuring root API files are preserved..."
cp -f ../api/*.js ../api/

# List the API files for verification
echo "API files available:"
ls -la ../api/

# Success message
echo "Build completed successfully!" 