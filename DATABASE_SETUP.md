# Setting Up MongoDB Atlas for WorkoutTracker

This guide explains how to set up MongoDB Atlas as the database for your WorkoutTracker application deployed on Vercel.

## Why MongoDB Atlas?

MongoDB Atlas is a fully managed cloud database service that works seamlessly with Vercel. The free tier provides:

- 512MB of storage (more than enough for this application)
- Shared clusters suitable for development and small production apps
- Automatic backups and security features
- Built-in connection pooling which works well with serverless functions

## Setup Instructions

### 1. Create a MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free account
2. Create a new organization and project if prompted
3. Create a new cluster (choose the FREE tier)
4. Choose a cloud provider and region (preferably one close to your Vercel deployment region)

### 2. Configure Database Access

1. In the MongoDB Atlas dashboard, go to "Database Access" under Security
2. Click "Add New Database User"
3. Create a new user with a strong password
4. Choose "Password" authentication method 
5. Under "Database User Privileges" select "Atlas admin" (for simplicity) or "Read and Write to Any Database"
6. Click "Add User"

### 3. Configure Network Access

1. In the MongoDB Atlas dashboard, go to "Network Access" under Security
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for simplicity) or specify Vercel's IP ranges
4. Click "Confirm"

### 4. Get Your Connection String

1. In the MongoDB Atlas dashboard, go to your cluster
2. Click "Connect"
3. Choose "Connect your application"
4. Make sure "Node.js" is selected as the driver
5. Copy the connection string
6. Replace `<password>` with your database user's password
7. Replace `<dbname>` with a database name (e.g., `workout_tracker`)

### 5. Run the Setup Script

We've created a script to automatically set up your MongoDB connection with Vercel:

```bash
./setup-mongodb.sh
```

When prompted, paste your MongoDB Atlas connection string. The script will:

1. Add the connection string as the `MONGODB_URI` environment variable in Vercel
2. Create a `.env.local` file for local development
3. Guide you through the next steps

### 6. Deploy Your Application

After setting up MongoDB, deploy your application:

```bash
vercel --prod
```

## Database Structure

The application uses the following collections:

- **goals**: Stores user fitness goals
- **workoutLogs**: Stores workout logs and exercise data
- **workoutPlans**: Stores workout plans and exercises
- **users**: Stores user data (currently using Auth0 for authentication)

## Local Development

For local development:

1. Ensure the `.env.local` file contains your MongoDB URI
2. Use the same database for development and production for simplicity
3. For a separate development database, create another cluster in MongoDB Atlas

## Troubleshooting

If you encounter database connection issues:

1. Check the Vercel logs for any connection errors
2. Verify your MongoDB Atlas cluster is running
3. Ensure the connection string is correct and the database user has proper permissions
4. Check that network access is properly configured
5. For local development, make sure the `.env.local` file is in the root directory 