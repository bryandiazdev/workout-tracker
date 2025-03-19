#!/bin/bash
# Script to set up MongoDB Atlas integration with Vercel

echo "======================================="
echo "MongoDB Atlas Setup for WorkoutTracker"
echo "======================================="
echo "This script will help you set up MongoDB Atlas for your Vercel deployment"
echo

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Error: Vercel CLI is not installed."
    echo "Please install it with: npm install -g vercel"
    exit 1
fi

# Ask for MongoDB Atlas connection string
echo "You'll need a MongoDB Atlas connection string."
echo "1. Create a free account at https://www.mongodb.com/cloud/atlas/register"
echo "2. Create a new cluster (the free tier is sufficient)"
echo "3. Create a database user and get your connection string"
echo

# Get MongoDB connection string
read -p "MongoDB Atlas Connection String: " mongodb_uri

if [ -z "$mongodb_uri" ]; then
    echo "Error: MongoDB connection string is required."
    exit 1
fi

# Confirm the connection string format
if [[ ! "$mongodb_uri" =~ ^mongodb(\+srv)?://[^:]+:[^@]+@[^/]+/.+$ ]]; then
    echo "Warning: The connection string doesn't match the expected format."
    echo "Expected format: mongodb+srv://<username>:<password>@<cluster-url>/<database>"
    read -p "Continue anyway? (y/n): " continue_anyway
    if [[ "$continue_anyway" != "y" && "$continue_anyway" != "Y" ]]; then
        echo "Setup aborted."
        exit 1
    fi
fi

echo
echo "Setting MongoDB URI in Vercel environment variables..."
vercel env add MONGODB_URI production -y << EOF
$mongodb_uri
EOF

# Create a .env.local file for local development
echo "Creating .env.local file for local development..."
cat > .env.local << EOF
MONGODB_URI=$mongodb_uri
EOF

echo
echo "MongoDB setup completed!"
echo "The MONGODB_URI environment variable has been added to your Vercel project."
echo "A .env.local file has been created for local development."
echo
echo "Next steps:"
echo "1. Deploy your application with: vercel --prod"
echo "2. Test your API endpoints to ensure they can connect to the database"
echo 