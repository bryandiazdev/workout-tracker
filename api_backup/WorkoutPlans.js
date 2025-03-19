// WorkoutPlans API endpoint
module.exports = (req, res) => {
  console.log(`Received ${req.method} request to /api/WorkoutPlans`);
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
  
  // For GET requests, return mock workout plans
  if (req.method === 'GET') {
    const userId = 'user-123'; // In a real app, this would be extracted from the token
    
    // Sample workout plans data
    const workoutPlans = [
      {
        id: "plan-1",
        name: "Strength Building",
        description: "A 4-week plan focused on building strength",
        created: "2023-03-01T10:00:00Z",
        userId: userId,
        exercises: [
          {
            id: "ex-1",
            name: "Bench Press",
            sets: 3,
            reps: "8-10",
            weight: "70% 1RM",
            notes: "Focus on form"
          },
          {
            id: "ex-2",
            name: "Squats",
            sets: 4,
            reps: "6-8",
            weight: "75% 1RM",
            notes: "Full depth"
          }
        ]
      },
      {
        id: "plan-2",
        name: "Endurance Plan",
        description: "A 6-week plan to improve cardiovascular health",
        created: "2023-02-15T14:30:00Z",
        userId: userId,
        exercises: [
          {
            id: "ex-3",
            name: "Running",
            duration: 30,
            distance: 5,
            notes: "Maintain steady pace"
          },
          {
            id: "ex-4",
            name: "Cycling",
            duration: 45,
            distance: 15,
            notes: "Interval training"
          }
        ]
      }
    ];
    
    // Return the response with the $values format that mimics the .NET response
    return res.status(200).json({
      $id: "1",
      $values: workoutPlans
    });
  }
  
  // For POST requests, handle workout plan creation
  if (req.method === 'POST') {
    try {
      console.log('Creating new workout plan with data:', req.body);
      
      // In a real app, we would save this to a database
      // For this mock, just return success with the data that would be created
      return res.status(201).json({
        id: "new-plan-" + Date.now(),
        ...req.body,
        created: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error creating workout plan:', error);
      return res.status(500).json({
        message: "Failed to create workout plan",
        error: error.message
      });
    }
  }
  
  // For other methods, return method not allowed
  return res.status(405).json({
    message: `Method ${req.method} not allowed`
  });
}; 