#!/bin/bash
# Deployment script for WorkoutTracker

echo "========================================"
echo "WorkoutTracker Deployment Script"
echo "========================================"
echo "This script will help you deploy to Vercel"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Error: Vercel CLI is not installed."
    echo "Please install it with: npm install -g vercel"
    exit 1
fi

# Check if .env exists and if not, create it from example
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo "No .env file found. Creating from .env.example..."
        cp .env.example .env
        echo "Please edit the .env file with your actual values before continuing."
        exit 1
    else
        echo "Warning: No .env or .env.example file found."
    fi
fi

# Ask if the user wants to update environment variables
read -p "Do you want to update environment variables in Vercel? (y/n): " update_env
if [[ $update_env == "y" || $update_env == "Y" ]]; then
    if [ -f ./setup-env.sh ]; then
        echo "Running environment variable setup script..."
        chmod +x ./setup-env.sh
        ./setup-env.sh
    else
        echo "Manual environment variable setup:"
        echo "Please enter your Auth0 configuration values:"
        
        read -p "Auth0 Domain: " auth0_domain
        read -p "Auth0 Client ID: " auth0_client_id
        read -p "Auth0 Audience: " auth0_audience
        read -p "Auth0 Callback URL (e.g., https://workout-tracker-rose.vercel.app/callback): " auth0_callback_url
        
        echo "Adding environment variables to Vercel..."
        vercel env add VUE_APP_AUTH0_DOMAIN production
        vercel env add VUE_APP_AUTH0_CLIENT_ID production
        vercel env add VUE_APP_AUTH0_AUDIENCE production
        vercel env add VUE_APP_AUTH0_CALLBACK_URL production
        
        # Add API URL (this should be /api for compatibility)
        vercel env add VUE_APP_API_URL production -y << EOF
/api
EOF
    fi
fi

# Deploy to Vercel
echo ""
echo "Deploying to Vercel..."
vercel --prod

echo ""
echo "Deployment completed!"
echo "Your application should be available at: https://workout-tracker-rose.vercel.app"
echo ""
echo "NOTE: If you see any authentication or API errors, make sure your environment variables are set correctly." 