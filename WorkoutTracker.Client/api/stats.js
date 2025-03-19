export default function handler(req, res) {
  // Extract the stat type from the query parameter
  const statType = req.query.type;

  switch (statType) {
    case 'summary':
      return getSummaryStats(req, res);
    case 'workout-frequency':
      return getWorkoutFrequency(req, res);
    case 'workout-duration':
      return getWorkoutDuration(req, res);
    case 'exercise-types':
      return getExerciseTypes(req, res);
    case 'muscle-groups':
      return getMuscleGroups(req, res);
    default:
      return res.status(400).json({ message: 'Invalid stat type' });
  }
}

function getSummaryStats(req, res) {
  const summaryStats = {
    totalWorkouts: 25,
    workoutsLast7Days: 3,
    totalWorkoutHours: 35,
    activeGoals: 3,
    favoriteExercises: ['Bench Press', 'Squats', 'Deadlift'],
    weeklyProgress: 15, // percentage increase
    streakDays: 3
  };

  res.status(200).json(summaryStats);
}

function getWorkoutFrequency(req, res) {
  // Generate 30 days of realistic workout frequency data
  const today = new Date();
  const data = {};
  
  // Create a workout pattern - more workouts on weekdays, fewer on weekends
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(today.getDate() - (29 - i)); // Go back 29 days and count forward
    
    const dateStr = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Create a realistic pattern:
    // - Higher probability of workouts on Mon, Wed, Fri
    // - Medium probability on Tue, Thu
    // - Lower probability on weekends
    let workoutCount = 0;
    
    if ([1, 3, 5].includes(dayOfWeek)) { // Mon, Wed, Fri
      workoutCount = Math.random() > 0.2 ? 1 : 0; // 80% chance of workout
    } else if ([2, 4].includes(dayOfWeek)) { // Tue, Thu
      workoutCount = Math.random() > 0.5 ? 1 : 0; // 50% chance of workout
    } else { // Sat, Sun
      workoutCount = Math.random() > 0.7 ? 1 : 0; // 30% chance of workout
    }
    
    // Occasionally have 2 workouts in a day (e.g., morning and evening)
    if (workoutCount === 1 && Math.random() > 0.9) {
      workoutCount = 2;
    }
    
    data[dateStr] = workoutCount;
  }

  res.status(200).json(data);
}

function getWorkoutDuration(req, res) {
  // Generate 30 days of workout duration data
  const today = new Date();
  const data = {};
  
  // Create a workout frequency pattern first
  const frequencyData = {};
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(today.getDate() - (29 - i));
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();
    
    let hasWorkout = false;
    if ([1, 3, 5].includes(dayOfWeek)) {
      hasWorkout = Math.random() > 0.2; // 80% chance of workout
    } else if ([2, 4].includes(dayOfWeek)) {
      hasWorkout = Math.random() > 0.5; // 50% chance of workout
    } else {
      hasWorkout = Math.random() > 0.7; // 30% chance of workout
    }
    
    frequencyData[dateStr] = hasWorkout ? 1 : 0;
  }
  
  // Now generate duration data based on frequency
  for (const dateStr in frequencyData) {
    if (frequencyData[dateStr] > 0) {
      const date = new Date(dateStr);
      const dayOfWeek = date.getDay();
      
      if ([1, 5].includes(dayOfWeek)) {
        // Monday and Friday - typically strength training (45-75 min)
        data[dateStr] = Math.floor(Math.random() * 31) + 45;
      } else if ([3].includes(dayOfWeek)) {
        // Wednesday - typically longer sessions (60-90 min)
        data[dateStr] = Math.floor(Math.random() * 31) + 60;
      } else if ([2, 4].includes(dayOfWeek)) {
        // Tuesday, Thursday - typically cardio (30-60 min)
        data[dateStr] = Math.floor(Math.random() * 31) + 30;
      } else {
        // Weekends - variable (30-90 min)
        data[dateStr] = Math.floor(Math.random() * 61) + 30;
      }
    } else {
      data[dateStr] = 0;
    }
  }

  res.status(200).json(data);
}

function getExerciseTypes(req, res) {
  const exerciseTypes = {
    'Strength Training': 42,
    'Cardio': 35,
    'Flexibility': 15,
    'HIIT': 8
  };

  res.status(200).json(exerciseTypes);
}

function getMuscleGroups(req, res) {
  const muscleGroups = {
    'Chest': 22,
    'Back': 25,
    'Legs': 30,
    'Arms': 18,
    'Shoulders': 15,
    'Core': 20
  };

  res.status(200).json(muscleGroups);
} 