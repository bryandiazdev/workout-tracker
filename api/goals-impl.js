// API handler for the Goals endpoint
const { connectToDatabase } = require('./db');
const { ObjectId } = require('mongodb');

module.exports = async (req, res) => {
  // Enable CORS for API routes
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Extract authentication token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Authorization required',
      error: 'Missing or invalid Authorization header'
    });
  }
  
  // Extract user ID from token
  let userId = null;
  try {
    const token = authHeader.split(' ')[1];
    const tokenPayload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    userId = tokenPayload.sub || 'user-123';
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid authentication token',
      error: error.message
    });
  }
  
  try {
    // Connect to MongoDB
    const { db } = await connectToDatabase();
    const collection = db.collection('goals');
    
    // Route based on HTTP method
    if (req.method === 'GET') {
      // Check if we're getting a specific goal or all goals
      const goalId = req.url.split('/').filter(Boolean).pop();
      
      if (goalId && ObjectId.isValid(goalId)) {
        // Get a specific goal
        const goal = await collection.findOne({
          _id: new ObjectId(goalId),
          userId
        });
        
        if (!goal) {
          return res.status(404).json({ message: 'Goal not found' });
        }
        
        return res.status(200).json({
          ...goal,
          id: goal._id.toString()
        });
      } else {
        // Get all goals for the user
        const goals = await collection.find({ userId }).toArray();
        
        // OData format response
        return res.status(200).json({
          $id: "1",
          $values: goals.map(goal => ({
            ...goal,
            id: goal._id.toString()
          }))
        });
      }
    } else if (req.method === 'POST') {
      // Create a new goal
      let goalData;
      
      // Parse request body based on content type
      if (typeof req.body === 'string') {
        goalData = JSON.parse(req.body);
      } else {
        goalData = req.body;
      }
      
      // Create a new goal document
      const newGoal = {
        name: goalData.name,
        description: goalData.description,
        targetDate: goalData.targetDate,
        metricType: goalData.metricType,
        startingValue: goalData.startingValue,
        currentValue: goalData.currentValue,
        targetValue: goalData.targetValue,
        progressHistory: goalData.progressHistory || [],
        isCompleted: goalData.isCompleted || false,
        userId,
        createdDate: new Date().toISOString()
      };
      
      const result = await collection.insertOne(newGoal);
      
      return res.status(201).json({
        ...newGoal,
        id: result.insertedId.toString()
      });
    } else if (req.method === 'PUT') {
      // Update an existing goal
      let goalData;
      
      // Parse request body based on content type
      if (typeof req.body === 'string') {
        goalData = JSON.parse(req.body);
      } else {
        goalData = req.body;
      }
      
      const goalId = req.url.split('/').filter(Boolean).pop();
      if (!goalId || !ObjectId.isValid(goalId)) {
        return res.status(400).json({ message: 'Goal ID is required and must be valid' });
      }
      
      // Prepare update document
      const updateData = { ...goalData };
      delete updateData._id; // Prevent modifying ID
      delete updateData.id;  // Prevent modifying ID
      
      // Add update timestamp
      updateData.updatedDate = new Date().toISOString();
      
      const result = await collection.updateOne(
        { _id: new ObjectId(goalId), userId },
        { $set: updateData }
      );
      
      if (result.matchedCount === 0) {
        return res.status(404).json({ message: 'Goal not found' });
      }
      
      // Get the updated goal
      const updatedGoal = await collection.findOne({
        _id: new ObjectId(goalId),
        userId
      });
      
      return res.status(200).json({
        ...updatedGoal,
        id: updatedGoal._id.toString()
      });
    } else if (req.method === 'DELETE') {
      const goalId = req.url.split('/').filter(Boolean).pop();
      if (!goalId || !ObjectId.isValid(goalId)) {
        return res.status(400).json({ message: 'Goal ID is required and must be valid' });
      }
      
      const result = await collection.deleteOne({
        _id: new ObjectId(goalId),
        userId
      });
      
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'Goal not found' });
      }
      
      return res.status(200).json({ message: 'Goal deleted successfully' });
    } else {
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    return res.status(500).json({
      message: 'Server error processing goal request',
      error: error.message
    });
  }
}; 