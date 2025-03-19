// Lowercase goals.js implementation
const { connectToDatabase } = require('./db');
const { ObjectId } = require('mongodb');

module.exports = async (req, res) => {
  console.log(`Received ${req.method} request to /api/goals (lowercase)`);
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
  let userId = 'user-123'; // Default fallback ID
  try {
    // Simple JWT parsing to extract sub claim (this is a basic version)
    const token = authHeader.split(' ')[1];
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    console.log('Extracted token payload:', payload);
    userId = payload.sub || userId;
    console.log('Using userId:', userId);
  } catch (error) {
    console.warn('Error parsing token, using default userId:', error.message);
  }
  
  try {
    // Connect to database
    const { db } = await connectToDatabase();
    const collection = db.collection('goals');
    
    // Handle GET request - retrieve goals
    if (req.method === 'GET') {
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
        const formattedGoals = goals.map(goal => ({
          ...goal,
          id: goal._id.toString()
        }));
        
        console.log('Found goals in database:', formattedGoals.length);
        
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
        
        console.log('Received goal data:', goalData);
        
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
        console.log('Inserting goal:', newGoal);
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
        
        console.log(`Updating goal with ID: ${goalId}`, updateData);
        
        // Update in database
        const result = await collection.updateOne(
          { 
            _id: ObjectId.isValid(goalId) ? new ObjectId(goalId) : goalId,
            userId: userId 
          },
          { $set: updateData }
        );
        
        console.log('Update result:', result);
        
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
            
            console.log('Delete result:', result);
            
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
    return res.status(500).json({
      message: "Database connection error",
      error: error.message
    });
  }
}; 