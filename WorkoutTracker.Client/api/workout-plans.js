export default function handler(req, res) {
  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getWorkoutPlans(req, res);
    case 'POST':
      return createWorkoutPlan(req, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

function getWorkoutPlans(req, res) {
  // Return mock workout plans data
  const mockWorkoutPlans = [
    { 
      id: 1, 
      name: 'Full Body Workout', 
      description: 'Works all major muscle groups', 
      frequency: 'Every other day',
      exercises: [
        { id: 1, name: 'Bench Press', description: 'Barbell bench press', targetSets: 3, targetReps: 10 },
        { id: 2, name: 'Squats', description: 'Barbell back squats', targetSets: 4, targetReps: 8 },
        { id: 3, name: 'Pull-ups', description: 'Body weight pull-ups', targetSets: 3, targetReps: 8 }
      ]
    },
    { 
      id: 2, 
      name: 'Cardio Routine', 
      description: 'High intensity cardio training', 
      frequency: '3 times per week',
      exercises: [
        { id: 4, name: 'Treadmill', description: 'Running on treadmill', targetDuration: 30 },
        { id: 5, name: 'Jump Rope', description: 'Jumping rope intervals', targetDuration: 15 }
      ]
    },
    { 
      id: 3, 
      name: 'Upper/Lower Split', 
      description: 'Focus on upper body one day, lower body next', 
      frequency: '4 times per week',
      exercises: [
        { id: 6, name: 'Overhead Press', description: 'Shoulder press with barbell', targetSets: 3, targetReps: 8 },
        { id: 7, name: 'Deadlift', description: 'Conventional deadlift', targetSets: 3, targetReps: 5 }
      ]
    }
  ];

  // Return the response with the $values format that mimics the .NET response
  res.status(200).json({
    $id: "1",
    $values: mockWorkoutPlans
  });
}

function createWorkoutPlan(req, res) {
  try {
    // Parse the request body
    const workoutPlan = req.body;
    
    // Create a new mock workout plan with an ID
    const newWorkoutPlan = {
      ...workoutPlan,
      id: Date.now(), // Use timestamp as a simple ID
      created: new Date().toISOString()
    };
    
    // Return the created workout plan
    res.status(201).json(newWorkoutPlan);
  } catch (error) {
    res.status(400).json({ message: 'Invalid request', error: error.message });
  }
} 