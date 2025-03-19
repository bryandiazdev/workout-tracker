#!/bin/bash
# This script helps set up environment variables in Vercel
# Run this script to configure your environment variables securely

echo "Setting up environment variables in Vercel..."
echo "Note: You'll need to have your Auth0 credentials ready."
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Vercel CLI is not installed. Please install it with: npm install -g vercel"
    exit 1
fi

# Auth0 Configuration
read -p "Enter Auth0 Domain (e.g., dev-example.us.auth0.com): " AUTH0_DOMAIN
read -p "Enter Auth0 Client ID: " AUTH0_CLIENT_ID
read -p "Enter Auth0 Audience (e.g., https://workouttracker-api): " AUTH0_AUDIENCE
read -p "Enter Auth0 Callback URL (e.g., https://workout-tracker-rose.vercel.app/callback): " AUTH0_CALLBACK_URL

# Add the environment variables to Vercel
echo "Adding environment variables to Vercel..."
vercel env add VUE_APP_AUTH0_DOMAIN production
vercel env add VUE_APP_AUTH0_CLIENT_ID production
vercel env add VUE_APP_AUTH0_AUDIENCE production
vercel env add VUE_APP_AUTH0_CALLBACK_URL production

# Add API URL (this should be /api for best compatibility)
vercel env add VUE_APP_API_URL production -y << EOF
/api
EOF

echo ""
echo "Environment variables have been set up in Vercel!"
echo "Your sensitive data is now protected and won't be exposed in your GitHub repository."
echo ""
echo "To deploy with these environment variables, run: vercel --prod" 