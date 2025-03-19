// Database connection for serverless functions
const { MongoClient } = require('mongodb');

// Connection cache
let cachedClient = null;
let cachedDb = null;

// Connect to MongoDB function
async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    // Return cached connection
    return { client: cachedClient, db: cachedDb };
  }

  // Get the MongoDB connection string from environment
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  // Create new MongoDB client
  const client = new MongoClient(uri);
  
  // Connect to the client
  await client.connect();
  
  // Extract database name from connection string or use default
  let dbName = null;
  try {
    const url = new URL(uri);
    dbName = url.pathname.substring(1); // Remove leading slash
  } catch (e) {
    // Ignore URL parsing errors
  }
  
  // Use the provided database name or default to 'workout_tracker'
  const db = client.db(dbName || 'workout_tracker');
  
  // List available collections for debugging
  const collections = await db.listCollections().toArray();
  
  // Cache the database connection
  cachedClient = client;
  cachedDb = db;
  
  return { client, db };
}

module.exports = {
  connectToDatabase
}; 