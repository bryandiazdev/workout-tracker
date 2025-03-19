export default function handler(req, res) {
  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getWorkoutLogs(req, res);
    case 'POST':
      return createWorkoutLog(req, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

function getWorkoutLogs(req, res) {
  // Return mock workout logs data
  const mockWorkoutLogs = [
    { 
      id: 1, 
      workoutDate: '2023-05-15', 
      duration: 60, 
      notes: 'Good progress today', 
      exerciseLogs: [
        { id: 1, exerciseName: 'Bench Press', sets: 3, reps: 10, weight: 80, weightUnit: 'kg' },
        { id: 2, exerciseName: 'Squats', sets: 4, reps: 8, weight: 100, weightUnit: 'kg' },
        { id: 3, exerciseName: 'Pull-ups', sets: 3, reps: 8, weight: null, weightUnit: 'kg' }
      ], 
      workoutPlanId: 1,
      workoutPlan: { id: 1, name: 'Full Body Workout' } 
    },
    { 
      id: 2, 
      workoutDate: '2023-05-17', 
      duration: 45, 
      notes: 'Feeling tired', 
      exerciseLogs: [
        { id: 4, exerciseName: 'Treadmill', sets: 1, reps: 1, weight: null, weightUnit: 'kg', duration: 30 },
        { id: 5, exerciseName: 'Jump Rope', sets: 3, reps: 1, weight: null, weightUnit: 'kg', duration: 5 }
      ], 
      workoutPlanId: 2,
      workoutPlan: { id: 2, name: 'Cardio Routine' } 
    }
  ];

  // Return the response with the $values format that mimics the .NET response
  res.status(200).json({
    $id: "1",
    $values: mockWorkoutLogs
  });
}

function createWorkoutLog(req, res) {
  try {
    // Parse the request body
    const workoutLog = req.body;
    
    // Create a new mock workout log with an ID
    const newWorkoutLog = {
      ...workoutLog,
      id: Date.now(), // Use timestamp as a simple ID
      created: new Date().toISOString()
    };
    
    // Return the created workout log
    res.status(201).json(newWorkoutLog);
  } catch (error) {
    res.status(400).json({ message: 'Invalid request', error: error.message });
  }
} 