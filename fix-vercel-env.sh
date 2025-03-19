#!/bin/bash
# Script to fix environment variables in Vercel

# Auth0 domain value
AUTH0_DOMAIN="dev-47c4icnwccbjdiz5.us.auth0.com"
AUTH0_CLIENT_ID="6VxrjlK5YXdXm9FVX2GFPpBdwDShwuTc"
AUTH0_AUDIENCE="https://workouttracker-api"
AUTH0_CALLBACK_URL="https://workout-tracker-rose.vercel.app/callback"
API_URL="/api"

echo "Fixing Vercel environment variables..."

# Delete existing environment variables first
echo "Removing existing environment variables..."
vercel env rm VUE_APP_AUTH0_DOMAIN production -y
vercel env rm VUE_APP_AUTH0_CLIENT_ID production -y
vercel env rm VUE_APP_AUTH0_AUDIENCE production -y
vercel env rm VUE_APP_AUTH0_CALLBACK_URL production -y
vercel env rm VUE_APP_API_URL production -y

# Add correct environment variables
echo "Adding correct environment variables..."
echo "Setting VUE_APP_AUTH0_DOMAIN to $AUTH0_DOMAIN"
vercel env add VUE_APP_AUTH0_DOMAIN production -y << EOF
$AUTH0_DOMAIN
EOF

echo "Setting VUE_APP_AUTH0_CLIENT_ID to $AUTH0_CLIENT_ID"
vercel env add VUE_APP_AUTH0_CLIENT_ID production -y << EOF
$AUTH0_CLIENT_ID
EOF

echo "Setting VUE_APP_AUTH0_AUDIENCE to $AUTH0_AUDIENCE"
vercel env add VUE_APP_AUTH0_AUDIENCE production -y << EOF
$AUTH0_AUDIENCE
EOF

echo "Setting VUE_APP_AUTH0_CALLBACK_URL to $AUTH0_CALLBACK_URL"
vercel env add VUE_APP_AUTH0_CALLBACK_URL production -y << EOF
$AUTH0_CALLBACK_URL
EOF

echo "Setting VUE_APP_API_URL to $API_URL"
vercel env add VUE_APP_API_URL production -y << EOF
$API_URL
EOF

echo "Verifying environment variables..."
vercel env ls | grep VUE_APP_

echo "Environment variables fixed. Now deploy with:"
echo "vercel --prod" 