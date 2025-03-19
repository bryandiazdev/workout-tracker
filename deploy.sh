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

# Create both root and client .env files for development
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo "No .env file found. Creating from .env.example..."
        cp .env.example .env
        
        # Also create a .env file in the client directory
        cp .env WorkoutTracker.Client/.env
        
        echo "Please edit the .env files with your actual values before continuing."
        echo "Files created: ./.env and ./WorkoutTracker.Client/.env"
    else
        echo "Warning: No .env or .env.example file found."
    fi
else
    # Make sure client .env exists as well
    if [ ! -f WorkoutTracker.Client/.env ]; then
        echo "Creating .env file in client directory..."
        cp .env WorkoutTracker.Client/.env
    fi
fi

# Install required dependencies
echo "Checking and installing required dependencies..."
cd WorkoutTracker.Client
# Check if webpack is installed
if ! grep -q "webpack" package.json; then
    echo "Installing webpack..."
    npm install --save-dev webpack
fi

# Check if dotenv is installed
if ! grep -q "dotenv" package.json; then
    echo "Installing dotenv..."
    npm install --save dotenv
fi
cd ..

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
        read -p "Auth0 Callback URL (default: https://workout-tracker-rose.vercel.app/callback): " auth0_callback_url
        
        # Use default callback URL if empty
        if [ -z "$auth0_callback_url" ]; then
            auth0_callback_url="https://workout-tracker-rose.vercel.app/callback"
            echo "Using default callback URL: $auth0_callback_url"
        fi
        
        echo "Adding environment variables to Vercel..."
        vercel env add VUE_APP_AUTH0_DOMAIN production
        vercel env add VUE_APP_AUTH0_CLIENT_ID production
        vercel env add VUE_APP_AUTH0_AUDIENCE production
        vercel env add VUE_APP_AUTH0_CALLBACK_URL production
        
        # Add API URL (this should be /api for compatibility)
        vercel env add VUE_APP_API_URL production -y << EOF
/api
EOF

        # Also update local .env files with these values
        echo "Updating local .env files with these values..."
        # Update root .env
        sed -i '' "s|VUE_APP_AUTH0_DOMAIN=.*|VUE_APP_AUTH0_DOMAIN=$auth0_domain|g" .env
        sed -i '' "s|VUE_APP_AUTH0_CLIENT_ID=.*|VUE_APP_AUTH0_CLIENT_ID=$auth0_client_id|g" .env
        sed -i '' "s|VUE_APP_AUTH0_AUDIENCE=.*|VUE_APP_AUTH0_AUDIENCE=$auth0_audience|g" .env
        sed -i '' "s|VUE_APP_AUTH0_CALLBACK_URL=.*|VUE_APP_AUTH0_CALLBACK_URL=$auth0_callback_url|g" .env
        
        # Update client .env
        sed -i '' "s|VUE_APP_AUTH0_DOMAIN=.*|VUE_APP_AUTH0_DOMAIN=$auth0_domain|g" WorkoutTracker.Client/.env
        sed -i '' "s|VUE_APP_AUTH0_CLIENT_ID=.*|VUE_APP_AUTH0_CLIENT_ID=$auth0_client_id|g" WorkoutTracker.Client/.env
        sed -i '' "s|VUE_APP_AUTH0_AUDIENCE=.*|VUE_APP_AUTH0_AUDIENCE=$auth0_audience|g" WorkoutTracker.Client/.env
        sed -i '' "s|VUE_APP_AUTH0_CALLBACK_URL=.*|VUE_APP_AUTH0_CALLBACK_URL=$auth0_callback_url|g" WorkoutTracker.Client/.env
    fi
    
    # Verify environment variables are set
    echo "Verifying environment variables..."
    if [ -f WorkoutTracker.Client/.env ]; then
        echo "Local client .env file exists"
        grep -v '^#' WorkoutTracker.Client/.env | grep -v '^$' | while read -r line; do
            key=$(echo $line | cut -d= -f1)
            echo "- $key: [value set]"
        done
    else
        echo "Warning: Local client .env file not found."
    fi
    
    echo "Verifying Vercel environment variables..."
    vercel env ls | grep VUE_APP_
fi

# Deploy to Vercel
echo ""
echo "Rebuilding the application..."
cd WorkoutTracker.Client && npm run build && cd ..

echo ""
echo "Deploying to Vercel..."
vercel --prod

echo ""
echo "Deployment completed!"
echo "Your application should be available at: https://workout-tracker-rose.vercel.app"
echo ""
echo "NOTE: If you see any authentication or API errors, make sure your environment variables are set correctly."
echo "IMPORTANT: Ensure that your Auth0 application's Allowed Callback URLs include: https://workout-tracker-rose.vercel.app/callback" 