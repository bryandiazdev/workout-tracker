// WorkoutLogs API endpoint
module.exports = (req, res) => {
  console.log(`Received ${req.method} request to /api/WorkoutLogs`);
  console.log('URL path:', req.url);
  if (req.body) {
    console.log('Request body:', JSON.stringify(req.body).substring(0, 200) + '...');
  }
  
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
  
  // For GET requests, return mock workout logs
  if (req.method === 'GET') {
    const userId = 'user-123'; // In a real app, this would be extracted from the token
    
    // Sample workout logs data
    const workoutLogs = [
      {
        id: "log-1",
        name: "Morning Workout",
        date: "2023-03-15T08:00:00Z",
        duration: 45,
        notes: "Felt good, increased weights on all exercises",
        userId: userId,
        exerciseLogs: [
          {
            id: "exlog-1",
            exerciseId: "ex-1",
            name: "Bench Press",
            sets: [
              { setNumber: 1, reps: 10, weight: 135, notes: "Warm-up" },
              { setNumber: 2, reps: 8, weight: 155, notes: "Working set" },
              { setNumber: 3, reps: 6, weight: 175, notes: "Working set" }
            ]
          },
          {
            id: "exlog-2",
            exerciseId: "ex-2",
            name: "Squats",
            sets: [
              { setNumber: 1, reps: 10, weight: 185, notes: "Warm-up" },
              { setNumber: 2, reps: 8, weight: 205, notes: "Working set" },
              { setNumber: 3, reps: 8, weight: 225, notes: "Working set" }
            ]
          }
        ]
      },
      {
        id: "log-2",
        name: "Evening Cardio",
        date: "2023-03-14T18:30:00Z",
        duration: 30,
        notes: "Focused on HIIT",
        userId: userId,
        exerciseLogs: [
          {
            id: "exlog-3",
            exerciseId: "ex-3",
            name: "Running",
            duration: 30,
            distance: 5,
            notes: "Sprint intervals"
          }
        ]
      }
    ];
    
    // Return the response with the $values format that mimics the .NET response
    return res.status(200).json({
      $id: "1",
      $values: workoutLogs
    });
  }
  
  // For POST requests, handle workout log creation
  if (req.method === 'POST') {
    try {
      console.log('Creating new workout log with data:', req.body);
      
      // In a real app, we would save this to a database
      // For this mock, just return success with the data that would be created
      return res.status(201).json({
        id: "new-log-" + Date.now(),
        ...req.body,
        date: req.body.date || new Date().toISOString()
      });
    } catch (error) {
      console.error('Error creating workout log:', error);
      return res.status(500).json({
        message: "Failed to create workout log",
        error: error.message
      });
    }
  }
  
  // For other methods, return method not allowed
  return res.status(405).json({
    message: `Method ${req.method} not allowed`
  });
}; 