// Database connection for serverless functions
const { MongoClient } = require('mongodb');

// MongoDB connection string from environment variable
const uri = process.env.MONGODB_URI;
let cachedClient = null;
let cachedDb = null;

if (!uri) {
  console.error('Please define the MONGODB_URI environment variable');
}

async function connectToDatabase() {
  // If we already have a connection, use it
  if (cachedClient && cachedDb) {
    console.log('Using cached database connection');
    return { client: cachedClient, db: cachedDb };
  }

  if (!uri) {
    throw new Error(
      'Please define the MONGODB_URI environment variable inside .env.local'
    );
  }

  // Connect to server
  console.log('Creating new database connection');
  const client = new MongoClient(uri);
  await client.connect();
  
  // Get database
  const dbName = new URL(uri).pathname.substr(1);
  const db = client.db(dbName || 'workout_tracker');

  // Cache the connection
  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

module.exports = { connectToDatabase }; 