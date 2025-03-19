// Unified API handler for WorkoutTracker
// This consolidates multiple API endpoints into a single serverless function
// to work within Vercel's Hobby plan limits (12 functions maximum)

const goalsHandler = require('./goals-impl.js');
const { connectToDatabase } = require('./db');
const { ObjectId } = require('mongodb');

module.exports = async (req, res) => {
  console.log(`Unified API handler received ${req.method} request for: ${req.url}`);
  
  // Enable CORS for all routes
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS requests (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Parse the URL path to determine which handler to use
  const path = req.url.split('?')[0]; // Remove query string if present
  const segments = path.split('/').filter(Boolean);
  
  console.log('URL segments:', segments);
  
  // Extract the endpoint name (lowercase for consistency)
  // Fix: Check if the first segment is 'api', if so use the second segment as the endpoint
  let endpoint = '';
  if (segments.length > 0) {
    if (segments[0].toLowerCase() === 'api' && segments.length > 1) {
      // If URL contains /api/endpoint format
      endpoint = segments[1].toLowerCase();
      console.log(`Found API prefix in URL, using second segment as endpoint: ${endpoint}`);
    } else {
      // If URL is just /endpoint format (no /api/ prefix)
      endpoint = segments[0].toLowerCase();
      console.log(`No API prefix in URL, using first segment as endpoint: ${endpoint}`);
    }
  }

  console.log(`Routing request to endpoint: ${endpoint}`);
  
  try {
    // Special case for workout plan exercises
    if ((segments.length >= 3 && 
        segments[0].toLowerCase() === 'api' &&
        segments[1].toLowerCase() === 'workoutplans' && 
        segments[3] && segments[3].toLowerCase() === 'exercises') ||
        (segments.length >= 2 &&
        segments[0].toLowerCase() === 'workoutplans' &&
        segments[2] && segments[2].toLowerCase() === 'exercises')) {
      console.log('Handling workout plan exercise operation');
      return await handleWorkoutPlanExercises(req, res, segments);
    }
    
    // Route to the appropriate handler based on the endpoint
    switch (endpoint) {
      case 'goals':
      case 'goals_redirect':
      case 'lowercase-goals':
      case 'Goals':
        // For Goals endpoint, we'll handle directly here to ensure proper data retrieval
        if (req.method === 'GET') {
          return await handleGoalsGet(req, res);
        } else {
          // For other methods, use the existing handler
          return await goalsHandler(req, res);
        }
        
      case 'exercises':
      case 'Exercises':
        // Handle direct requests to the Exercises endpoint
        return await handleExercises(req, res);
        
      case 'workoutlogs':
      case 'WorkoutLogs':
        // Handle workout logs endpoint
        return await handleWorkoutLogs(req, res);
        
      case 'workoutplans':
      case 'WorkoutPlans':
        // Handle workout plans endpoint
        return await handleWorkoutPlans(req, res);
        
      case 'users':
        // Handle users endpoint
        return await handleUsers(req, res);
        
      case 'stats':
        // Handle stats endpoint
        return await handleStats(req, res);
        
      case 'health':
        // Handle health check endpoint
        return await handleHealth(req, res);
        
      case 'mongodb-test':
        // Handle the MongoDB test endpoint
        return await handleMongoDBTest(req, res);
        
      case 'env-test':
        // Handle the environment test endpoint
        return await handleEnvTest(req, res);
        
      default:
        // If no matching endpoint is found
        console.log(`No handler found for endpoint: ${endpoint}`);
        return res.status(404).json({
          message: `Endpoint '${endpoint}' not found`,
          note: "API has been consolidated to work within Vercel's function limits",
          url: req.url,
          segments: segments
        });
    }
  } catch (error) {
    console.error(`Error handling request to ${endpoint}:`, error);
    return res.status(500).json({
      message: "An error occurred processing your request",
      error: error.message
    });
  }
};

// New handler specifically for GET requests to the Goals endpoint
async function handleGoalsGet(req, res) {
  try {
    // Extract user ID from token
    const userId = await extractUserId(req);
    console.log('Getting goals for user:', userId);
    
    // Connect to database
    const { db } = await connectToDatabase();
    const collection = db.collection('goals');
    
    // Get all goals for the user
    console.log('Querying goals collection with userId:', userId);
    const goals = await collection.find({ userId }).toArray();
    console.log(`Found ${goals.length} goals for user ${userId}`);
    
    // Format goals to match expected client format
    const formattedGoals = goals.map(goal => ({
      ...goal,
      id: goal._id.toString(),
      // Ensure these properties exist and have the correct casing
      isCompleted: goal.isCompleted || goal.IsCompleted || false,
      name: goal.Name || goal.name,
      description: goal.Description || goal.description,
      targetDate: goal.TargetDate || goal.targetDate,
      startingValue: goal.StartingValue || goal.startingValue || 0,
      currentValue: goal.CurrentValue || goal.currentValue || 0,
      targetValue: goal.TargetValue || goal.targetValue || 0
    }));
    
    console.log('Formatted goals for response:', formattedGoals);
    
    // Return in the format expected by the client
    return res.status(200).json({
      $id: "1",
      $values: formattedGoals
    });
  } catch (error) {
    console.error('Error retrieving goals:', error);
    if (error.message === 'Missing or invalid authorization token') {
      return res.status(401).json({ message: error.message });
    }
    return res.status(500).json({ 
      message: "Error retrieving goals", 
      error: error.message 
    });
  }
}

// Extract user ID from Authorization header
async function extractUserId(req) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization token');
  }
  
  let userId = null;
  try {
    // Simple JWT parsing to extract sub claim
    const token = authHeader.split(' ')[1];
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    console.log('Extracted token payload:', payload);
    userId = payload.sub || 'user-123';
    console.log('Using userId from token:', userId);
  } catch (error) {
    console.warn('Error parsing token, using default userId:', error.message);
    userId = 'user-123'; // Fallback ID
  }
  
  return userId;
}

// Workout Logs handler
async function handleWorkoutLogs(req, res) {
  try {
    // Extract user ID from token
    const userId = await extractUserId(req);
    console.log('Processing workout logs for user:', userId);
    
    // Connect to database
    const { db } = await connectToDatabase();
    const collection = db.collection('workout_logs');
    
    // Handle different HTTP methods
    if (req.method === 'GET') {
      // Get all workout logs for the user
      console.log('Fetching workout logs from MongoDB');
      const logs = await collection.find({ userId }).toArray();
      console.log(`Found ${logs.length} workout logs for user ${userId}`);
      
      // Format the logs for the frontend
      const formattedLogs = logs.map(log => {
        console.log('Processing log:', JSON.stringify(log));
        
        // Handle both nested and flat structures
        let formattedLog = {
          id: log._id.toString()
        };
        
        // Handle case where data might be in a nested workoutLog object or at the root
        if (log.workoutLog) {
          // Nested structure
          formattedLog = {
            ...formattedLog,
            ...log.workoutLog,
            id: log._id.toString(),
            // Ensure date is properly formatted
            date: new Date(log.workoutLog.workoutDate).toISOString().split('T')[0],
            // Format duration (remove enclosing quotes if present)
            duration: log.workoutLog.duration ? log.workoutLog.duration.replace(/^"|"$/g, '') : "00:00:00",
            // Ensure exerciseLogs are included
            exercises: log.exerciseLogs || []
          };
        } else {
          // Flat structure
          formattedLog = {
            ...log,
            id: log._id.toString(),
            // Format date correctly for display if it exists
            date: log.workoutDate ? new Date(log.workoutDate).toISOString().split('T')[0] : new Date(log.createdDate).toISOString().split('T')[0],
            // Ensure duration is properly formatted
            duration: log.duration ? log.duration.replace(/^"|"$/g, '') : "00:00:00",
            // Make sure we have exercises array
            exercises: log.exerciseLogs || []
          };
        }
        
        // Calculate duration in minutes for display
        try {
          if (formattedLog.duration) {
            const [hours, minutes] = formattedLog.duration.split(':');
            formattedLog.durationMinutes = parseInt(hours) * 60 + parseInt(minutes);
          } else {
            formattedLog.durationMinutes = 0;
          }
        } catch (e) {
          console.error('Error parsing duration:', e);
          formattedLog.durationMinutes = 0;
        }
        
        console.log('Formatted log:', JSON.stringify(formattedLog));
        return formattedLog;
      });
      
      console.log(`Returning ${formattedLogs.length} formatted workout logs`);
      
      return res.status(200).json({
        $id: "1",
        $values: formattedLogs
      });
    } else if (req.method === 'POST') {
      // Create a new workout log
      let logData;
      if (typeof req.body === 'string') {
        logData = JSON.parse(req.body);
      } else {
        logData = req.body;
      }
      
      console.log('Creating new workout log with data:', JSON.stringify(logData));
      
      // Extract the main workout data if it's nested
      const workoutLogData = logData.workoutLog || logData;
      
      // Create a new document with flattened structure for better compatibility
      const newLog = {
        // Main workout data
        workoutDate: workoutLogData.workoutDate,
        duration: workoutLogData.duration,
        notes: workoutLogData.notes || "",
        workoutPlanId: workoutLogData.workoutPlanId,
        
        // Exercise logs as an array
        exerciseLogs: workoutLogData.exerciseLogs || workoutLogData.exercises || [],
        
        // Meta data
        userId,
        createdDate: new Date().toISOString()
      };
      
      console.log('Saving workout log to MongoDB:', JSON.stringify(newLog));
      const result = await collection.insertOne(newLog);
      console.log('Workout log saved with ID:', result.insertedId);
      
      return res.status(201).json({
        ...newLog,
        id: result.insertedId.toString()
      });
    } else if (req.method === 'PUT') {
      // Update a workout log
      let logData;
      if (typeof req.body === 'string') {
        logData = JSON.parse(req.body);
      } else {
        logData = req.body;
      }
      
      const logId = logData.id || logData._id;
      if (!logId) {
        return res.status(400).json({ message: "Log ID is required" });
      }
      
      delete logData.id;
      delete logData._id;
      
      // Extract the main workout data if it's nested
      const workoutLogData = logData.workoutLog || logData;
      
      // Create a flattened update document
      const updateData = {
        // Main workout data
        workoutDate: workoutLogData.workoutDate,
        duration: workoutLogData.duration,
        notes: workoutLogData.notes || "",
        workoutPlanId: workoutLogData.workoutPlanId,
        
        // Exercise logs as an array
        exerciseLogs: workoutLogData.exerciseLogs || workoutLogData.exercises || [],
        
        // Update timestamp
        updatedAt: new Date().toISOString()
      };
      
      const result = await collection.updateOne(
        { _id: ObjectId.isValid(logId) ? new ObjectId(logId) : logId, userId },
        { $set: updateData }
      );
      
      if (result.matchedCount === 0) {
        return res.status(404).json({ message: "Workout log not found" });
      }
      
      return res.status(200).json({
        ...updateData,
        id: logId
      });
    } else if (req.method === 'DELETE') {
      // Delete a workout log
      const parts = req.url.split('/').filter(Boolean);
      if (parts.length > 1) {
        const logId = parts[parts.length - 1];
        
        const result = await collection.deleteOne({
          _id: ObjectId.isValid(logId) ? new ObjectId(logId) : logId,
          userId
        });
        
        if (result.deletedCount === 0) {
          return res.status(404).json({ message: "Workout log not found" });
        }
        
        return res.status(200).json({ message: "Workout log deleted successfully" });
      }
      
      return res.status(400).json({ message: "Log ID is required" });
    }
    
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  } catch (error) {
    console.error('Error handling workout logs:', error);
    if (error.message === 'Missing or invalid authorization token') {
      return res.status(401).json({ message: error.message });
    }
    return res.status(500).json({ message: "Error processing workout logs", error: error.message });
  }
}

// Workout Plans handler
async function handleWorkoutPlans(req, res) {
  try {
    // Extract user ID from token
    const userId = await extractUserId(req);
    console.log('Processing workout plans for user:', userId);
    
    // Connect to database
    const { db } = await connectToDatabase();
    const collection = db.collection('workout_plans');
    
    // Handle different HTTP methods
    if (req.method === 'GET') {
      // Get all workout plans for the user
      console.log('Fetching workout plans from MongoDB');
      const plans = await collection.find({ userId }).toArray();
      console.log(`Found ${plans.length} workout plans for user ${userId}`);
      
      // Format the plans for the frontend
      const formattedPlans = plans.map(plan => {
        console.log('Processing plan:', JSON.stringify(plan));
        
        // Create a formatted plan object with consistent property names
        const formattedPlan = {
          ...plan,
          id: plan._id.toString(),
          // Ensure these properties exist with correct casing
          name: plan.Name || plan.name || 'Unnamed Workout Plan',
          description: plan.Description || plan.description || '',
          // Ensure exercises are available
          exercises: plan.exercises || plan.Exercises || [],
          // Format creation date
          createdAt: plan.createdDate || plan.createdAt || new Date().toISOString()
        };
        
        console.log('Formatted plan:', JSON.stringify(formattedPlan));
        return formattedPlan;
      });
      
      console.log(`Returning ${formattedPlans.length} formatted workout plans`);
      
      return res.status(200).json({
        $id: "1",
        $values: formattedPlans
      });
    } else if (req.method === 'POST') {
      // Create a new workout plan
      let planData;
      if (typeof req.body === 'string') {
        planData = JSON.parse(req.body);
      } else {
        planData = req.body;
      }
      
      console.log('Creating new workout plan with data:', JSON.stringify(planData));
      
      // Normalize the plan data
      const newPlan = {
        name: planData.name || planData.Name || 'Unnamed Workout Plan',
        description: planData.description || planData.Description || '',
        exercises: planData.exercises || planData.Exercises || [],
        userId,
        createdDate: new Date().toISOString()
      };
      
      console.log('Saving workout plan to MongoDB:', JSON.stringify(newPlan));
      const result = await collection.insertOne(newPlan);
      console.log('Workout plan saved with ID:', result.insertedId);
      
      return res.status(201).json({
        ...newPlan,
        id: result.insertedId.toString()
      });
    } else if (req.method === 'PUT') {
      // Update a workout plan
      let planData;
      if (typeof req.body === 'string') {
        planData = JSON.parse(req.body);
      } else {
        planData = req.body;
      }
      
      const planId = planData.id || planData._id;
      if (!planId) {
        return res.status(400).json({ message: "Plan ID is required" });
      }
      
      delete planData.id;
      delete planData._id;
      
      // Normalize the plan data
      const updateData = {
        // Use either casing version of the fields
        name: planData.name || planData.Name || 'Unnamed Workout Plan',
        description: planData.description || planData.Description || '',
        exercises: planData.exercises || planData.Exercises || [],
        updatedAt: new Date().toISOString()
      };
      
      const result = await collection.updateOne(
        { _id: ObjectId.isValid(planId) ? new ObjectId(planId) : planId, userId },
        { $set: updateData }
      );
      
      if (result.matchedCount === 0) {
        return res.status(404).json({ message: "Workout plan not found" });
      }
      
      return res.status(200).json({
        ...updateData,
        id: planId
      });
    } else if (req.method === 'DELETE') {
      // Delete a workout plan
      const parts = req.url.split('/').filter(Boolean);
      if (parts.length > 1) {
        const planId = parts[parts.length - 1];
        
        const result = await collection.deleteOne({
          _id: ObjectId.isValid(planId) ? new ObjectId(planId) : planId,
          userId
        });
        
        if (result.deletedCount === 0) {
          return res.status(404).json({ message: "Workout plan not found" });
        }
        
        return res.status(200).json({ message: "Workout plan deleted successfully" });
      }
      
      return res.status(400).json({ message: "Plan ID is required" });
    }
    
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  } catch (error) {
    console.error('Error handling workout plans:', error);
    if (error.message === 'Missing or invalid authorization token') {
      return res.status(401).json({ message: error.message });
    }
    return res.status(500).json({ message: "Error processing workout plans", error: error.message });
  }
}

// Users handler
async function handleUsers(req, res) {
  try {
    // Extract user ID from token
    const userId = await extractUserId(req);
    
    // Connect to database
    const { db } = await connectToDatabase();
    const collection = db.collection('users');
    
    // Check if the URL contains "/me" or a specific user ID
    const parts = req.url.split('/').filter(Boolean);
    const isMe = parts.length > 1 && parts[1].toLowerCase() === 'me';
    
    if (isMe || (parts.length === 1)) {
      // Handle the current user
      if (req.method === 'GET') {
        // Get the current user's profile
        const user = await collection.findOne({ userId });
        
        if (user) {
          return res.status(200).json({
            ...user,
            id: user._id.toString()
          });
        } else {
          // If user doesn't exist yet, return basic info
          return res.status(200).json({
            userId,
            isNewUser: true
          });
        }
      } else if (req.method === 'POST' || req.method === 'PUT') {
        // Create or update user profile
        let userData;
        if (typeof req.body === 'string') {
          userData = JSON.parse(req.body);
        } else {
          userData = req.body;
        }
        
        // Add or update user data
        const result = await collection.updateOne(
          { userId },
          { 
            $set: {
              ...userData,
              userId,
              updatedAt: new Date().toISOString()
            },
            $setOnInsert: {
              createdAt: new Date().toISOString()
            }
          },
          { upsert: true }
        );
        
        // Get the updated user
        const updatedUser = await collection.findOne({ userId });
        
        return res.status(200).json({
          ...updatedUser,
          id: updatedUser._id.toString()
        });
      }
    }
    
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  } catch (error) {
    console.error('Error handling users:', error);
    if (error.message === 'Missing or invalid authorization token') {
      return res.status(401).json({ message: error.message });
    }
    return res.status(500).json({ message: "Error processing user data", error: error.message });
  }
}

// Stats handler
async function handleStats(req, res) {
  try {
    // Extract user ID from token
    const userId = await extractUserId(req);
    
    // Connect to database
    const { db } = await connectToDatabase();
    
    // Check if the request is for the summary
    const parts = req.url.split('/').filter(Boolean);
    const isSummary = parts.length > 1 && parts[1].toLowerCase() === 'summary';
    
    if (isSummary) {
      // Get summary statistics
      const workoutLogs = await db.collection('workout_logs').find({ userId }).toArray();
      const goals = await db.collection('goals').find({ userId }).toArray();
      const workoutPlans = await db.collection('workout_plans').find({ userId }).toArray();
      
      // Calculate some basic stats
      const totalWorkouts = workoutLogs.length;
      const completedGoals = goals.filter(g => g.isCompleted).length;
      const activeGoals = goals.filter(g => !g.isCompleted).length;
      const totalPlans = workoutPlans.length;
      
      return res.status(200).json({
        userId,
        stats: {
          totalWorkouts,
          completedGoals,
          activeGoals,
          totalPlans,
          lastWorkout: totalWorkouts > 0 ? workoutLogs.sort((a, b) => 
            new Date(b.createdDate) - new Date(a.createdDate))[0] : null
        }
      });
    } else {
      // Handle other stats requests
      return res.status(200).json({
        message: "Stats endpoint is primarily for /summary. Use specific endpoints for detailed data."
      });
    }
  } catch (error) {
    console.error('Error handling stats:', error);
    if (error.message === 'Missing or invalid authorization token') {
      return res.status(401).json({ message: error.message });
    }
    return res.status(500).json({ message: "Error processing statistics", error: error.message });
  }
}

// Health check handler
async function handleHealth(req, res) {
  // Simple health check endpoint
  const authHeader = req.headers.authorization;
  const isAuth = req.url.includes('/auth');
  
  // Check if authentication is required
  if (isAuth) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    try {
      // Verify the token is valid format
      const token = authHeader.split(' ')[1];
      const parts = token.split('.');
      if (parts.length !== 3) {
        return res.status(401).json({ message: 'Invalid token format' });
      }
      
      return res.status(200).json({
        status: 'ok',
        message: 'API is running with authentication',
        auth: true,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(401).json({ message: 'Invalid authentication' });
    }
  }
  
  // Basic health check without auth
  return res.status(200).json({
    status: 'ok',
    message: 'API is running',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/api/goals',
      '/api/workoutlogs',
      '/api/workoutplans',
      '/api/users',
      '/api/stats',
      '/api/health'
    ]
  });
}

// MongoDB test endpoint handler
async function handleMongoDBTest(req, res) {
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
}

// Environment variables test endpoint handler
async function handleEnvTest(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  // Check for specific environment variables (without revealing sensitive values)
  const envStatus = {
    MONGODB_URI: {
      exists: !!process.env.MONGODB_URI,
      value: process.env.MONGODB_URI ? `${process.env.MONGODB_URI.substring(0, 15)}...` : null
    },
    // Check other important environment variables
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
}

// Handle direct requests to the Exercises endpoint
async function handleExercises(req, res) {
  try {
    console.log('Handling direct request to Exercises endpoint');
    console.log(`Method: ${req.method}, URL: ${req.url}`);
    
    // Extract user ID from token
    const userId = await extractUserId(req);
    
    // Handle different HTTP methods
    if (req.method === 'POST') {
      // Get the request body
      let exerciseData;
      if (typeof req.body === 'string') {
        exerciseData = JSON.parse(req.body);
      } else {
        exerciseData = req.body;
      }
      
      console.log('Exercise data received:', JSON.stringify(exerciseData));
      
      // Check if a workout plan ID is included - handle case insensitivity
      const workoutPlanId = exerciseData.workoutPlanId || exerciseData.WorkoutPlanId || exerciseData.planId || exerciseData.PlanId;
      
      if (workoutPlanId) {
        console.log(`Workout plan ID found: ${workoutPlanId}, forwarding to workout plan exercises handler`);
        
        // Connect to database to check if the plan exists
        const { db } = await connectToDatabase();
        const collection = db.collection('workout_plans');
        
        const plan = await collection.findOne({
          _id: ObjectId.isValid(workoutPlanId) ? new ObjectId(workoutPlanId) : workoutPlanId,
          userId
        });
        
        if (!plan) {
          return res.status(404).json({ message: "Workout plan not found or not accessible" });
        }
        
        // Create a segments array to simulate the workout plan exercises path
        const segments = ['api', 'workoutplans', workoutPlanId, 'exercises'];
        
        // Normalize the exercise data to handle case sensitivity
        const normalizedExerciseData = {
          ...exerciseData,
          name: exerciseData.name || exerciseData.Name,
          description: exerciseData.description || exerciseData.Description || '',
          sets: exerciseData.sets || exerciseData.Sets || 3,
          reps: exerciseData.reps || exerciseData.Reps || 10,
          weight: exerciseData.weight || exerciseData.Weight || null,
          weightUnit: exerciseData.weightUnit || exerciseData.WeightUnit || 'kg',
          duration: exerciseData.duration || exerciseData.Duration || null,
          notes: exerciseData.notes || exerciseData.Notes || '',
          muscleGroups: exerciseData.muscleGroups || exerciseData.MuscleGroups || []
        };

        // Replace the original request body with the normalized data
        req.body = normalizedExerciseData;
        
        // Forward to the workout plan exercises handler
        return await handleWorkoutPlanExercises(req, res, segments);
      }
      
      // If no plan ID is provided, create a standalone exercise in a dedicated collection
      console.log('No workout plan ID found, creating standalone exercise');
      
      // Handle case sensitivity for exercise properties
      const exerciseName = exerciseData.name || exerciseData.Name;
      
      // Validate exercise data
      if (!exerciseName) {
        return res.status(400).json({ message: "Exercise name is required" });
      }
      
      // Connect to database
      const { db } = await connectToDatabase();
      const collection = db.collection('exercises');
      
      // Create a new exercise document with normalized field names
      const newExercise = {
        name: exerciseName,
        description: exerciseData.description || exerciseData.Description || '',
        sets: exerciseData.sets || exerciseData.Sets || 3,
        reps: exerciseData.reps || exerciseData.Reps || 10,
        weight: exerciseData.weight || exerciseData.Weight || null,
        weightUnit: exerciseData.weightUnit || exerciseData.WeightUnit || 'kg',
        duration: exerciseData.duration || exerciseData.Duration || null,
        notes: exerciseData.notes || exerciseData.Notes || '',
        muscleGroups: exerciseData.muscleGroups || exerciseData.MuscleGroups || [],
        userId,
        createdDate: new Date().toISOString()
      };
      
      console.log('Creating standalone exercise:', JSON.stringify(newExercise));
      const result = await collection.insertOne(newExercise);
      
      return res.status(201).json({
        ...newExercise,
        id: result.insertedId.toString()
      });
    } else if (req.method === 'GET') {
      // Retrieve exercises (either standalone or from all workout plans)
      const { db } = await connectToDatabase();
      
      // Get standalone exercises
      const standaloneExercises = await db.collection('exercises')
        .find({ userId })
        .toArray();
      
      // Get workout plans with exercises
      const plans = await db.collection('workout_plans')
        .find({ userId })
        .toArray();
      
      // Extract exercises from all plans and flatten the array
      const planExercises = plans
        .filter(plan => plan.exercises && Array.isArray(plan.exercises))
        .flatMap(plan => plan.exercises.map(exercise => ({
          ...exercise,
          workoutPlanId: plan._id.toString(),
          workoutPlanName: plan.name || plan.Name || 'Unnamed Plan'
        })));
      
      // Combine both sets of exercises
      const allExercises = [
        ...standaloneExercises.map(ex => ({
          ...ex,
          id: ex._id.toString(),
          standalone: true
        })),
        ...planExercises
      ];
      
      console.log(`Returning ${allExercises.length} exercises (${standaloneExercises.length} standalone, ${planExercises.length} from plans)`);
      
      return res.status(200).json({
        $id: "1",
        $values: allExercises
      });
    }
    
    return res.status(405).json({ 
      message: `Method ${req.method} not allowed`,
      note: "The Exercises endpoint currently supports GET (to list exercises) and POST (to create exercises)"
    });
  } catch (error) {
    console.error('Error handling exercises:', error);
    if (error.message === 'Missing or invalid authorization token') {
      return res.status(401).json({ message: error.message });
    }
    return res.status(500).json({ 
      message: "Error processing exercises", 
      error: error.message 
    });
  }
}

// Workout Plan Exercises handler for operations on exercises within a plan
async function handleWorkoutPlanExercises(req, res, segments) {
  try {
    console.log('Handling workout plan exercises with segments:', segments);
    
    // Extract user ID from token
    const userId = await extractUserId(req);
    
    // Extract plan ID from URL path
    // URL pattern could be either:
    // 1. /api/workoutplans/{planId}/exercises
    // 2. /workoutplans/{planId}/exercises
    
    let planIdIndex = 0;
    let exerciseIdIndex = 0;
    
    // Determine the index of planId based on URL pattern
    if (segments[0].toLowerCase() === 'api') {
      // Pattern: /api/workoutplans/{planId}/exercises
      planIdIndex = 2;
      exerciseIdIndex = 4;
    } else {
      // Pattern: /workoutplans/{planId}/exercises
      planIdIndex = 1;
      exerciseIdIndex = 3;
    }
    
    // Ensure we have enough segments for the planId
    if (segments.length <= planIdIndex) {
      return res.status(400).json({ message: "Invalid URL format. Expected /api/workoutplans/{planId}/exercises" });
    }
    
    const planId = segments[planIdIndex];
    console.log(`Processing exercises for workout plan ${planId} for user ${userId}`);
    
    if (!planId || !ObjectId.isValid(planId)) {
      return res.status(400).json({ message: "Invalid workout plan ID" });
    }
    
    // Connect to database
    const { db } = await connectToDatabase();
    const collection = db.collection('workout_plans');
    
    // First, check if the plan exists and belongs to the user
    const plan = await collection.findOne({
      _id: new ObjectId(planId),
      userId
    });
    
    if (!plan) {
      return res.status(404).json({ message: "Workout plan not found or not accessible" });
    }
    
    // Check if the plan already has an exercises array
    if (!plan.exercises) {
      plan.exercises = [];
    }
    
    // Check if we're dealing with a specific exercise
    const hasExerciseId = segments.length > exerciseIdIndex;
    let exerciseId = null;
    
    if (hasExerciseId) {
      exerciseId = segments[exerciseIdIndex];
      console.log(`Operating on specific exercise ${exerciseId}`);
    }
    
    // Handle different HTTP methods
    if (req.method === 'GET') {
      if (hasExerciseId) {
        // Get a specific exercise
        const exercise = plan.exercises.find(e => e.id === exerciseId);
        if (!exercise) {
          return res.status(404).json({ message: "Exercise not found" });
        }
        return res.status(200).json(exercise);
      } else {
        // Get all exercises for the plan
        return res.status(200).json({
          planId: plan._id.toString(),
          exercises: plan.exercises
        });
      }
    } else if (req.method === 'POST') {
      // Add a new exercise to the plan
      let exerciseData;
      if (typeof req.body === 'string') {
        exerciseData = JSON.parse(req.body);
      } else {
        exerciseData = req.body;
      }
      
      console.log('Adding exercise to workout plan:', JSON.stringify(exerciseData));
      
      // Handle case sensitivity for exercise properties
      const exerciseName = exerciseData.name || exerciseData.Name;
      
      // Validate exercise data
      if (!exerciseName) {
        return res.status(400).json({ message: "Exercise name is required" });
      }
      
      // Create a new exercise with an ID and timestamp, handling case sensitivity
      const newExercise = {
        id: new ObjectId().toString(), // Generate a unique ID for the exercise
        name: exerciseName,
        description: exerciseData.description || exerciseData.Description || '',
        sets: exerciseData.sets || exerciseData.Sets || 3,
        reps: exerciseData.reps || exerciseData.Reps || 10,
        weight: exerciseData.weight || exerciseData.Weight || null,
        weightUnit: exerciseData.weightUnit || exerciseData.WeightUnit || 'kg',
        duration: exerciseData.duration || exerciseData.Duration || null,
        notes: exerciseData.notes || exerciseData.Notes || '',
        muscleGroups: exerciseData.muscleGroups || exerciseData.MuscleGroups || [],
        createdDate: new Date().toISOString()
      };
      
      // Update the workout plan with the new exercise
      const result = await collection.updateOne(
        { _id: new ObjectId(planId), userId },
        { 
          $push: { exercises: newExercise },
          $set: { updatedAt: new Date().toISOString() }
        }
      );
      
      if (result.modifiedCount === 0) {
        return res.status(500).json({ message: "Failed to add exercise to workout plan" });
      }
      
      console.log(`Successfully added exercise to plan ${planId}`);
      return res.status(201).json({
        message: "Exercise added successfully",
        exercise: newExercise
      });
    } else if (req.method === 'PUT' && hasExerciseId) {
      // Update an existing exercise
      let exerciseData;
      if (typeof req.body === 'string') {
        exerciseData = JSON.parse(req.body);
      } else {
        exerciseData = req.body;
      }
      
      console.log(`Updating exercise ${exerciseId} in workout plan ${planId}`);
      
      // Find the exercise index
      const exerciseIndex = plan.exercises.findIndex(e => e.id === exerciseId);
      if (exerciseIndex === -1) {
        return res.status(404).json({ message: "Exercise not found" });
      }
      
      // Create updated exercise object
      const updatedExercise = {
        ...plan.exercises[exerciseIndex],
        ...exerciseData,
        id: exerciseId, // Preserve the original ID
        updatedAt: new Date().toISOString()
      };
      
      // Update the exercise in the array
      const updatePath = `exercises.${exerciseIndex}`;
      const updateObj = { [updatePath]: updatedExercise };
      
      const result = await collection.updateOne(
        { _id: new ObjectId(planId), userId },
        { 
          $set: {
            ...updateObj,
            updatedAt: new Date().toISOString()
          }
        }
      );
      
      if (result.modifiedCount === 0) {
        return res.status(500).json({ message: "Failed to update exercise" });
      }
      
      console.log(`Successfully updated exercise ${exerciseId}`);
      return res.status(200).json({
        message: "Exercise updated successfully",
        exercise: updatedExercise
      });
    } else if (req.method === 'DELETE' && hasExerciseId) {
      // Remove an exercise from the plan
      console.log(`Removing exercise ${exerciseId} from workout plan ${planId}`);
      
      // Check if the exercise exists
      const exerciseExists = plan.exercises.some(e => e.id === exerciseId);
      if (!exerciseExists) {
        return res.status(404).json({ message: "Exercise not found" });
      }
      
      // Remove the exercise
      const result = await collection.updateOne(
        { _id: new ObjectId(planId), userId },
        { 
          $pull: { exercises: { id: exerciseId } },
          $set: { updatedAt: new Date().toISOString() }
        }
      );
      
      if (result.modifiedCount === 0) {
        return res.status(500).json({ message: "Failed to remove exercise" });
      }
      
      console.log(`Successfully removed exercise ${exerciseId} from plan ${planId}`);
      return res.status(200).json({
        message: "Exercise removed successfully"
      });
    }
    
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  } catch (error) {
    console.error('Error handling workout plan exercises:', error);
    if (error.message === 'Missing or invalid authorization token') {
      return res.status(401).json({ message: error.message });
    }
    return res.status(500).json({ 
      message: "Error processing workout plan exercises", 
      error: error.message 
    });
  }
} 