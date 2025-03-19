// Shared implementation for both lowercase and uppercase Goals endpoints
const { connectToDatabase } = require('./db');
const { ObjectId } = require('mongodb');

async function handleGoalsRequest(req, res) {
  console.log(`Received ${req.method} request to API Goals endpoint`);
  console.log('URL path:', req.url);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS requests (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Extract token from Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      message: 'Missing or invalid authorization token'
    });
  }
  
  // Extract user ID from token
  let userId = null;
  let tokenPayload = null;
  try {
    // Simple JWT parsing to extract sub claim
    const token = authHeader.split(' ')[1];
    tokenPayload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    console.log('Extracted token payload:', tokenPayload);
    userId = tokenPayload.sub;
    console.log('Using userId from token:', userId);
  } catch (error) {
    console.error('Error parsing token:', error.message);
    console.error('Token extraction failed. Will use a default user ID.');
    userId = 'user-123'; // Fallback ID
  }
  
  if (!userId) {
    console.error('No user ID found in token, using default');
    userId = 'user-123'; // Another fallback if the sub claim is missing
  }
  
  try {
    // Connect to database
    console.log('Attempting to connect to MongoDB...');
    const { db } = await connectToDatabase();
    console.log('Successfully connected to MongoDB');
    
    const collection = db.collection('goals');
    console.log('Using collection: goals');
    
    // Handle GET request - retrieve goals
    if (req.method === 'GET') {
      console.log('Processing GET request for goals');
      
      // Check if specific goal ID is requested
      if (req.url.includes('/')) {
        const parts = req.url.split('/').filter(Boolean);
        if (parts.length > 1) {
          const goalId = parts[parts.length - 1];
          console.log(`Fetching specific goal with ID: ${goalId}`);
          
          try {
            const goal = await collection.findOne({ 
              _id: ObjectId.isValid(goalId) ? new ObjectId(goalId) : goalId,
              userId: userId 
            });
            
            console.log('Goal found:', goal ? 'yes' : 'no');
            
            if (goal) {
              return res.status(200).json({
                ...goal,
                id: goal._id.toString()
              });
            } else {
              return res.status(404).json({ message: "Goal not found" });
            }
          } catch (error) {
            console.error('Error fetching specific goal:', error);
            return res.status(500).json({ message: "Error retrieving goal", error: error.message });
          }
        }
      }
      
      // Get all goals for the user
      try {
        console.log(`Fetching all goals for user: ${userId}`);
        const goals = await collection.find({ userId: userId }).toArray();
        console.log('Found goals in database:', goals.length);
        
        const formattedGoals = goals.map(goal => ({
          ...goal,
          id: goal._id.toString()
        }));
        
        // Return in the format expected by client
        return res.status(200).json({
          $id: "1",
          $values: formattedGoals
        });
      } catch (error) {
        console.error('Error fetching goals:', error);
        return res.status(500).json({ message: "Error retrieving goals", error: error.message });
      }
    }
    
    // Handle POST request - create a new goal
    if (req.method === 'POST') {
      console.log('Processing POST request to create new goal');
      try {
        // Ensure the body is parsed correctly
        let goalData;
        
        if (typeof req.body === 'string') {
          try {
            goalData = JSON.parse(req.body);
          } catch (e) {
            console.error('Error parsing request body string:', e);
            return res.status(400).json({ message: "Invalid JSON in request body" });
          }
        } else {
          goalData = req.body;
        }
        
        console.log('Received goal data:', JSON.stringify(goalData));
        
        if (!goalData) {
          console.error('No goal data provided');
          return res.status(400).json({ message: "No goal data provided" });
        }
        
        // Prepare goal for insertion
        const newGoal = {
          ...goalData,
          userId: userId,
          createdDate: new Date().toISOString(),
          isCompleted: false,
          progresses: []
        };
        
        // Insert into database
        console.log('Inserting goal:', JSON.stringify(newGoal));
        const result = await collection.insertOne(newGoal);
        console.log('Goal inserted with ID:', result.insertedId);
        
        // Return the created goal with ID
        return res.status(201).json({
          ...newGoal,
          id: result.insertedId.toString()
        });
      } catch (error) {
        console.error('Error creating goal:', error);
        return res.status(500).json({
          message: "Failed to create goal",
          error: error.message
        });
      }
    }
    
    // Handle PUT request - update goal
    if (req.method === 'PUT') {
      console.log('Processing PUT request to update goal');
      try {
        // Ensure the body is parsed correctly
        let goalData;
        
        if (typeof req.body === 'string') {
          try {
            goalData = JSON.parse(req.body);
          } catch (e) {
            console.error('Error parsing request body string:', e);
            return res.status(400).json({ message: "Invalid JSON in request body" });
          }
        } else {
          goalData = req.body;
        }
        
        console.log('Received goal data for update:', JSON.stringify(goalData));
        
        const goalId = goalData.id || goalData._id;
        
        if (!goalId) {
          return res.status(400).json({ message: "Goal ID is required" });
        }
        
        // Prepare update data (remove id field as it's stored in _id)
        const updateData = { ...goalData };
        delete updateData.id;
        delete updateData._id;
        
        // Add updated timestamp
        updateData.updatedAt = new Date().toISOString();
        
        console.log(`Updating goal with ID: ${goalId}`, JSON.stringify(updateData));
        
        // Update in database
        const result = await collection.updateOne(
          { 
            _id: ObjectId.isValid(goalId) ? new ObjectId(goalId) : goalId,
            userId: userId 
          },
          { $set: updateData }
        );
        
        console.log('Update result:', JSON.stringify(result));
        
        if (result.matchedCount === 0) {
          return res.status(404).json({ message: "Goal not found" });
        }
        
        // Return updated goal
        return res.status(200).json({
          ...goalData,
          updatedAt: updateData.updatedAt
        });
      } catch (error) {
        console.error('Error updating goal:', error);
        return res.status(500).json({
          message: "Failed to update goal",
          error: error.message
        });
      }
    }
    
    // Handle DELETE request - delete goal
    if (req.method === 'DELETE') {
      console.log('Processing DELETE request for goal');
      try {
        if (req.url.includes('/')) {
          const parts = req.url.split('/').filter(Boolean);
          if (parts.length > 1) {
            const goalId = parts[parts.length - 1];
            console.log(`Deleting goal with ID: ${goalId}`);
            
            const result = await collection.deleteOne({ 
              _id: ObjectId.isValid(goalId) ? new ObjectId(goalId) : goalId,
              userId: userId 
            });
            
            console.log('Delete result:', JSON.stringify(result));
            
            if (result.deletedCount === 0) {
              return res.status(404).json({ message: "Goal not found" });
            }
            
            return res.status(200).json({ message: "Goal deleted successfully" });
          }
        }
        
        return res.status(400).json({ message: "Goal ID is required" });
      } catch (error) {
        console.error('Error deleting goal:', error);
        return res.status(500).json({
          message: "Failed to delete goal",
          error: error.message
        });
      }
    }
    
    // For other methods, return method not allowed
    return res.status(405).json({
      message: `Method ${req.method} not allowed`
    });
  } catch (error) {
    console.error('Database connection error:', error);
    console.error('Stack trace:', error.stack);
    return res.status(500).json({
      message: "Database connection error",
      error: error.message,
      details: "Check Vercel logs for more information"
    });
  }
}

module.exports = handleGoalsRequest; 