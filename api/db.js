// Database connection for serverless functions
const { MongoClient } = require('mongodb');

// MongoDB connection string from environment variable
const uri = process.env.MONGODB_URI;
let cachedClient = null;
let cachedDb = null;

if (!uri) {
  console.error('ERROR: MONGODB_URI environment variable is not defined!');
  console.error('Environment variables available:', Object.keys(process.env).join(', '));
}

async function connectToDatabase() {
  // If we already have a connection, use it
  if (cachedClient && cachedDb) {
    console.log('Using cached database connection');
    return { client: cachedClient, db: cachedDb };
  }

  if (!uri) {
    throw new Error(
      'MONGODB_URI environment variable is not defined. Please check Vercel project settings and .env.local file.'
    );
  }

  console.log('Attempting to connect to MongoDB with URI:', uri.substring(0, 20) + '...');
  
  // Connect to server with options for better reliability
  console.log('Creating new database connection');
  const options = {
    connectTimeoutMS: 10000, // 10 seconds
    socketTimeoutMS: 45000,  // 45 seconds
    retryWrites: true,
    maxPoolSize: 10,         // Maximum number of connections in the pool
    serverSelectionTimeoutMS: 15000, // Wait 15 seconds before timing out
  };
  
  const client = new MongoClient(uri, options);
  
  try {
    await client.connect();
    console.log('Successfully connected to MongoDB');
    
    // Get database name from URI or use default
    let dbName;
    try {
      const url = new URL(uri);
      dbName = url.pathname ? url.pathname.substring(1) : null;
      console.log('Extracted database name from URI:', dbName || '(none)');
    } catch (error) {
      console.warn('Could not parse database name from URI, using default:', error.message);
      dbName = null;
    }
    
    const db = client.db(dbName || 'workout_tracker');
    console.log('Using database:', dbName || 'workout_tracker');
    
    // Test the connection by listing collections
    try {
      const collections = await db.listCollections().toArray();
      console.log('Available collections:', collections.map(c => c.name).join(', '));
    } catch (error) {
      console.warn('Could not list collections, but connection seems established:', error.message);
    }
    
    // Cache the connection
    cachedClient = client;
    cachedDb = db;
    
    return { client, db };
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    console.error('Connection stack trace:', error.stack);
    
    // Additional diagnostics
    console.error('MongoDB URI format valid:', uri.startsWith('mongodb'));
    console.error('MongoDB URI includes username/password:', uri.includes('@'));
    
    // Ensure we don't leave a hanging connection
    if (client) {
      await client.close().catch(err => {
        console.error('Error closing MongoDB client:', err.message);
      });
    }
    
    throw error;
  }
}

module.exports = { connectToDatabase }; 