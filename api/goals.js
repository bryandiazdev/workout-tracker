// Goals API endpoint
module.exports = (req, res) => {
  console.log(`Received ${req.method} request to /api/goals`);
  console.log('URL path:', req.url);
  
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
  
  // For GET requests, return mock goals
  if (req.method === 'GET') {
    const userId = 'user-123'; // In a real app, this would be extracted from the token
    
    // Sample goals data
    const goals = [
      {
        id: "goal-1",
        name: "Increase Bench Press",
        description: "Increase bench press weight by 20 pounds",
        targetDate: "2023-06-30T00:00:00Z",
        createdDate: "2023-03-01T00:00:00Z",
        isCompleted: false,
        userId: userId,
        category: "Strength",
        progresses: [
          {
            id: "progress-1",
            date: "2023-03-15T00:00:00Z",
            value: 185,
            notes: "Added 5 pounds this week"
          },
          {
            id: "progress-2",
            date: "2023-03-22T00:00:00Z",
            value: 190,
            notes: "Consistent progress"
          }
        ]
      },
      {
        id: "goal-2",
        name: "Run 10K",
        description: "Complete a 10K run under 50 minutes",
        targetDate: "2023-05-15T00:00:00Z",
        createdDate: "2023-02-01T00:00:00Z",
        isCompleted: false,
        userId: userId,
        category: "Cardio",
        progresses: [
          {
            id: "progress-3",
            date: "2023-02-15T00:00:00Z",
            value: 55,
            notes: "First 10K attempt - 55 minutes"
          },
          {
            id: "progress-4",
            date: "2023-03-01T00:00:00Z",
            value: 53.5,
            notes: "Getting closer - 53.5 minutes"
          }
        ]
      },
      {
        id: "goal-3",
        name: "Weight Loss",
        description: "Lose 10 pounds",
        targetDate: "2023-04-30T00:00:00Z",
        createdDate: "2023-01-15T00:00:00Z",
        isCompleted: false,
        userId: userId,
        category: "Weight",
        progresses: [
          {
            id: "progress-5",
            date: "2023-02-01T00:00:00Z",
            value: 185,
            notes: "Starting weight"
          },
          {
            id: "progress-6",
            date: "2023-03-01T00:00:00Z",
            value: 180,
            notes: "Down 5 pounds"
          }
        ]
      }
    ];
    
    // For specific goal ID requests
    if (req.url.includes('/')) {
      const parts = req.url.split('/');
      if (parts.length > 1) {
        const goalId = parts[parts.length - 1];
        
        const goal = goals.find(g => g.id === goalId);
        if (goal) {
          return res.status(200).json(goal);
        } else {
          return res.status(404).json({ message: "Goal not found" });
        }
      }
    }
    
    // Return the response with the $values format that mimics the .NET response
    return res.status(200).json({
      $id: "1",
      $values: goals
    });
  }
  
  // For POST requests, handle goal creation
  if (req.method === 'POST') {
    try {
      console.log('Creating new goal with data:', req.body);
      
      // In a real app, we would save this to a database
      // For this mock, just return success with the data that would be created
      return res.status(201).json({
        id: "new-goal-" + Date.now(),
        ...req.body,
        createdDate: new Date().toISOString(),
        isCompleted: false,
        progresses: []
      });
    } catch (error) {
      console.error('Error creating goal:', error);
      return res.status(500).json({
        message: "Failed to create goal",
        error: error.message
      });
    }
  }
  
  // For PUT requests, handle goal updates
  if (req.method === 'PUT') {
    try {
      console.log('Updating goal with data:', req.body);
      
      // In a real app, we would update in a database
      // For this mock, just return success with the updated data
      return res.status(200).json({
        ...req.body,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating goal:', error);
      return res.status(500).json({
        message: "Failed to update goal",
        error: error.message
      });
    }
  }
  
  // For other methods, return method not allowed
  return res.status(405).json({
    message: `Method ${req.method} not allowed`
  });
}; 