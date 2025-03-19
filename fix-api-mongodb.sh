#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}    MongoDB & Vercel Configuration Fix   ${NC}"
echo -e "${BLUE}=========================================${NC}"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}Error: Vercel CLI is not installed${NC}"
    echo -e "Please install it with: npm install -g vercel"
    exit 1
fi

# Check if user is logged in to Vercel
echo -e "${YELLOW}Checking Vercel login status...${NC}"
VERCEL_TOKEN=$(vercel whoami 2>&1)
if [[ $VERCEL_TOKEN == *"Error"* ]]; then
    echo -e "${RED}You are not logged in to Vercel.${NC}"
    echo -e "Please run: vercel login"
    exit 1
else
    echo -e "${GREEN}Logged in to Vercel as: $VERCEL_TOKEN${NC}"
fi

# Check for MongoDB URI
echo -e "${YELLOW}Checking for MongoDB URI in .env.local...${NC}"
if [ ! -f .env.local ]; then
    echo -e "${RED}Error: .env.local file not found${NC}"
    echo -e "Please create a .env.local file with your MongoDB URI"
    
    # Prompt to create the file
    read -p "Would you like to create it now? (y/n): " CREATE_ENV
    if [[ $CREATE_ENV == "y" || $CREATE_ENV == "Y" ]]; then
        read -p "Enter your MongoDB URI: " MONGODB_URI
        echo "MONGODB_URI=$MONGODB_URI" > .env.local
        echo -e "${GREEN}Created .env.local with MongoDB URI${NC}"
    else
        exit 1
    fi
fi

# Read MongoDB URI from .env.local
MONGODB_URI=$(grep MONGODB_URI .env.local | cut -d '=' -f2-)

if [ -z "$MONGODB_URI" ]; then
    echo -e "${RED}Error: MONGODB_URI not found in .env.local${NC}"
    read -p "Enter your MongoDB URI: " MONGODB_URI
    if [ -z "$MONGODB_URI" ]; then
        echo -e "${RED}No MongoDB URI provided. Exiting.${NC}"
        exit 1
    fi
    # Update .env.local with the provided URI
    if grep -q "MONGODB_URI" .env.local; then
        # Replace existing line
        sed -i '' "s|MONGODB_URI=.*|MONGODB_URI=$MONGODB_URI|" .env.local
    else
        # Add new line
        echo "MONGODB_URI=$MONGODB_URI" >> .env.local
    fi
    echo -e "${GREEN}Updated .env.local with MongoDB URI${NC}"
else
    echo -e "${GREEN}Found MongoDB URI in .env.local${NC}"
fi

# Add MongoDB URI to Vercel environment variables
echo -e "${YELLOW}Setting MongoDB URI in Vercel...${NC}"
vercel env add MONGODB_URI production
echo -e "${GREEN}MongoDB URI added to Vercel production environment${NC}"

# Update vercel.json if needed
if [ ! -f vercel.json ]; then
    echo -e "${RED}Error: vercel.json file not found${NC}"
    echo -e "Creating a basic vercel.json file..."
    
    cat > vercel.json << EOF
{
  "version": 2,
  "buildCommand": "./build.sh",
  "outputDirectory": "WorkoutTracker.Client/dist",
  "routes": [
    { "handle": "filesystem" },
    { "src": "/callback(.*)", "dest": "/index.html" },
    { "src": "/api/health", "dest": "/api/health.js" },
    { "src": "/api/WorkoutLogs", "dest": "/api/WorkoutLogs.js" },
    { "src": "/api/workoutlogs", "dest": "/api/WorkoutLogs.js" },
    { "src": "/api/WorkoutPlans", "dest": "/api/WorkoutPlans.js" },
    { "src": "/api/workoutplans", "dest": "/api/WorkoutPlans.js" },
    { "src": "/api/Goals", "dest": "/api/Goals.js" },
    { "src": "/api/goals", "dest": "/api/goals.js" },
    { "src": "/api/env-test", "dest": "/api/env-test.js" },
    { "src": "/api/stats", "dest": "/api/stats.js" },
    { "src": "/api/Users", "dest": "/api/users.js" },
    { "src": "/api/users", "dest": "/api/users.js" },
    { "src": "/(.*)", "dest": "/index.html" }
  ],
  "env": {
    "MONGODB_URI": "@mongodb_uri"
  }
}
EOF
    echo -e "${GREEN}Created vercel.json file${NC}"
else
    echo -e "${GREEN}vercel.json file exists${NC}"
    
    # Check if "env" section exists in vercel.json
    if ! grep -q '"env"' vercel.json; then
        echo -e "${YELLOW}Adding env section to vercel.json...${NC}"
        # This is a simple replacement that might not work for all JSON structures
        # A proper JSON parser would be better, but this is a basic solution
        sed -i '' 's/}$/,\n  "env": {\n    "MONGODB_URI": "@mongodb_uri"\n  }\n}/' vercel.json
        echo -e "${GREEN}Added env section to vercel.json${NC}"
    fi
fi

# Check if Goals.js file exists
if [ ! -f api/Goals.js ]; then
    echo -e "${YELLOW}Creating api/Goals.js to handle capitalized endpoint...${NC}"
    mkdir -p api
    cat > api/Goals.js << EOF
// This file handles requests to /api/Goals (capital G)
// Import the actual implementation from lowercase-goals.js
const goalsImplementation = require('./lowercase-goals.js');

// Export the implementation
module.exports = goalsImplementation;
EOF
    echo -e "${GREEN}Created api/Goals.js file${NC}"
else
    echo -e "${GREEN}api/Goals.js file exists${NC}"
fi

# Create env-test endpoint if it doesn't exist
if [ ! -f api/env-test.js ]; then
    echo -e "${YELLOW}Creating api/env-test.js to test environment variables...${NC}"
    cat > api/env-test.js << EOF
// Simple API endpoint to test environment variable access
module.exports = (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS requests (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  // Check for specific environment variables (without revealing sensitive values)
  const envStatus = {
    MONGODB_URI: {
      exists: !!process.env.MONGODB_URI,
      value: process.env.MONGODB_URI ? `${process.env.MONGODB_URI.substring(0, 15)}...` : null
    },
    NODE_ENV: {
      exists: !!process.env.NODE_ENV,
      value: process.env.NODE_ENV
    }
  };
  
  // Log environment variable status (for debugging)
  console.log('Environment variable status:', JSON.stringify(envStatus, null, 2));
  console.log('All environment variable names:', Object.keys(process.env).join(', '));
  
  // Return the environment status
  return res.status(200).json({
    message: 'Environment variable check',
    envStatus,
    allVariables: Object.keys(process.env)
  });
};
EOF
    echo -e "${GREEN}Created api/env-test.js endpoint${NC}"
else
    echo -e "${GREEN}api/env-test.js endpoint exists${NC}"
fi

# Make the script executable
chmod +x fix-api-mongodb.sh

echo -e "${BLUE}=========================================${NC}"
echo -e "${GREEN}Configuration complete!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Deploy your application with: ${BLUE}vercel --prod${NC}"
echo -e "2. Test the API environment with: ${BLUE}curl https://your-domain.vercel.app/api/env-test${NC}"
echo -e "3. Check your MongoDB connection with: ${BLUE}curl https://your-domain.vercel.app/api/goals${NC}"
echo -e "${BLUE}=========================================${NC}" 