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
    console.log('Extracted user ID:', userId);
  } catch (error) {
    console.error('Error extracting user ID from token:', error);
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
      console.log('Processing POST request to create a new goal');
      
      // Create a new goal
      let goalData;
      
      // Parse request body based on content type
      if (typeof req.body === 'string') {
        goalData = JSON.parse(req.body);
        console.log('Parsed request body from string:', goalData);
      } else {
        goalData = req.body;
        console.log('Request body is already an object:', typeof goalData);
      }
      
      console.log('Raw goal data received:', JSON.stringify(goalData, null, 2));
      
      // Extract goal properties supporting both uppercase and lowercase naming
      // Handle the possibility of both naming conventions in the same request
      const newGoal = {
        // Support both naming conventions (lowercase from API model, uppercase from our MongoDB model)
        Name: goalData.Name || goalData.name || '',
        Description: goalData.Description || goalData.description || '',
        Unit: goalData.Unit || goalData.unit || 'kg',
        StartDate: goalData.StartDate || goalData.startDate || new Date().toISOString(),
        TargetDate: goalData.TargetDate || goalData.targetDate || new Date().toISOString(),
        StartingValue: parseFloat(goalData.StartingValue || goalData.startingValue) || 0,
        CurrentValue: parseFloat(goalData.CurrentValue || goalData.currentValue) || 0,
        TargetValue: parseFloat(goalData.TargetValue || goalData.targetValue) || 0,
        MetricType: goalData.MetricType || goalData.metricType || goalData.Type || goalData.type || 'weight',
        IsCompleted: goalData.IsCompleted || goalData.isCompleted || false,
        // Also maintain lowercase versions for backward compatibility
        name: goalData.Name || goalData.name || '',
        description: goalData.Description || goalData.description || '',
        unit: goalData.Unit || goalData.unit || 'kg',
        startDate: goalData.StartDate || goalData.startDate || new Date().toISOString(),
        targetDate: goalData.TargetDate || goalData.targetDate || new Date().toISOString(),
        startingValue: parseFloat(goalData.StartingValue || goalData.startingValue) || 0,
        currentValue: parseFloat(goalData.CurrentValue || goalData.currentValue) || 0,
        targetValue: parseFloat(goalData.TargetValue || goalData.targetValue) || 0,
        metricType: goalData.MetricType || goalData.metricType || goalData.Type || goalData.type || 'weight',
        isCompleted: goalData.IsCompleted || goalData.isCompleted || false,
        // Store User information if provided
        User: goalData.User || { Auth0Id: userId },
        userId: userId,
        createdDate: new Date().toISOString(),
        progresses: goalData.progresses || goalData.Progresses || []
      };
      
      console.log('Prepared goal data for MongoDB insertion:', JSON.stringify(newGoal, null, 2));
      
      const result = await collection.insertOne(newGoal);
      console.log('MongoDB insertion result:', result);
      
      // Return the newly created goal
      const createdGoal = {
        ...newGoal,
        _id: result.insertedId,
        id: result.insertedId.toString()
      };
      
      console.log('Returning created goal:', JSON.stringify(createdGoal, null, 2));
      return res.status(201).json(createdGoal);
    } else if (req.method === 'PUT') {
      console.log('Processing PUT request to update an existing goal');
      
      // Update an existing goal
      let goalData;
      
      // Parse request body based on content type
      if (typeof req.body === 'string') {
        goalData = JSON.parse(req.body);
        console.log('Parsed request body from string:', goalData);
      } else {
        goalData = req.body;
        console.log('Request body is already an object:', typeof goalData);
      }
      
      console.log('Raw update data received:', JSON.stringify(goalData, null, 2));
      
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
      
      console.log('Prepared update data:', JSON.stringify(updateData, null, 2));
      
      const result = await collection.updateOne(
        { _id: new ObjectId(goalId), userId },
        { $set: updateData }
      );
      
      console.log('MongoDB update result:', result);
      
      if (result.matchedCount === 0) {
        return res.status(404).json({ message: 'Goal not found' });
      }
      
      // Get the updated goal
      const updatedGoal = await collection.findOne({
        _id: new ObjectId(goalId),
        userId
      });
      
      console.log('Returning updated goal:', JSON.stringify(updatedGoal, null, 2));
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
    console.error('Server error processing goal request:', error);
    return res.status(500).json({
      message: 'Server error processing goal request',
      error: error.message,
      stack: error.stack
    });
  }
}; 