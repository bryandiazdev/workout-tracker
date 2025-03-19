// MongoDB test endpoint for checking database connectivity
const { connectToDatabase } = require('./db');

module.exports = async (req, res) => {
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
  
  console.log('MongoDB test endpoint called');
  
  // Check MONGODB_URI
  const uri = process.env.MONGODB_URI;
  const hasMongoDB = !!uri;
  
  const testResults = {
    mongodb_uri_exists: hasMongoDB,
    uri_format_valid: hasMongoDB ? uri.startsWith('mongodb') : false,
    uri_has_credentials: hasMongoDB ? uri.includes('@') : false,
    connection_test: null,
    list_collections: null,
    test_insert: null,
    database_name: null,
    error: null
  };
  
  if (!hasMongoDB) {
    testResults.error = 'MONGODB_URI environment variable is not defined';
    return res.status(500).json({
      message: 'MongoDB configuration error',
      results: testResults
    });
  }
  
  try {
    console.log('Attempting to connect to MongoDB...');
    const startTime = Date.now();
    const { client, db } = await connectToDatabase();
    const connectTime = Date.now() - startTime;
    
    testResults.connection_test = {
      success: true,
      time_ms: connectTime
    };
    
    // Get database name
    try {
      const url = new URL(uri);
      const pathName = url.pathname ? url.pathname.substring(1) : null;
      testResults.database_name = db.databaseName;
      console.log('Database name from URL:', pathName);
      console.log('Actual database name:', db.databaseName);
    } catch (error) {
      console.error('Error extracting database name:', error);
    }
    
    // List collections
    try {
      console.log('Listing collections...');
      const collections = await db.listCollections().toArray();
      testResults.list_collections = {
        success: true,
        collections: collections.map(c => c.name)
      };
      console.log('Collections:', collections.map(c => c.name).join(', '));
    } catch (error) {
      console.error('Error listing collections:', error);
      testResults.list_collections = {
        success: false,
        error: error.message
      };
    }
    
    // Test write access with a test document
    try {
      console.log('Testing write access with test insert...');
      const testCollection = db.collection('mongodb_test');
      const testDoc = {
        timestamp: new Date().toISOString(),
        test: true,
        message: 'This is a test document to verify MongoDB write access'
      };
      
      const result = await testCollection.insertOne(testDoc);
      testResults.test_insert = {
        success: true,
        inserted_id: result.insertedId.toString()
      };
      console.log('Test document inserted with ID:', result.insertedId);
      
      // Clean up by removing the test document
      await testCollection.deleteOne({ _id: result.insertedId });
      console.log('Test document deleted');
    } catch (error) {
      console.error('Error in test insert:', error);
      testResults.test_insert = {
        success: false,
        error: error.message
      };
    }
    
    return res.status(200).json({
      message: 'MongoDB connection test completed',
      results: testResults
    });
  } catch (error) {
    console.error('MongoDB test failed:', error);
    testResults.error = error.message;
    testResults.connection_test = {
      success: false,
      error: error.message
    };
    
    return res.status(500).json({
      message: 'MongoDB connection test failed',
      results: testResults,
      error: error.message,
      stack: error.stack
    });
  }
}; 