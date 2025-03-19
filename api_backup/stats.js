// Stats API endpoint
module.exports = (req, res) => {
  console.log(`Received ${req.method} request to /api/stats`);
  console.log('URL path:', req.url);
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
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
  
  // Only handle GET requests
  if (req.method === 'GET') {
    // Mock stats data
    const stats = {
      totalWorkouts: 24,
      last7Days: 5,
      totalHours: 38.5,
      activeGoals: 3,
      workoutFrequency: {
        labels: generateLast30DaysLabels(),
        data: generateRandomFrequencyData()
      },
      workoutDuration: {
        labels: generateLast30DaysLabels(),
        data: generateRandomDurationData()
      },
      exerciseTypes: {
        labels: ["Strength", "Cardio", "Flexibility", "Balance", "Functional"],
        data: [45, 30, 10, 5, 10]
      },
      muscleGroups: {
        labels: ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Full Body"],
        data: [20, 20, 25, 15, 15, 20, 5]
      }
    };
    
    return res.status(200).json(stats);
  }
  
  // For other methods, return method not allowed
  return res.status(405).json({
    message: `Method ${req.method} not allowed`
  });
};

// Helper functions to generate mock data
function generateLast30DaysLabels() {
  const labels = [];
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    labels.push(formatDate(date));
  }
  
  return labels;
}

function formatDate(date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function generateRandomFrequencyData() {
  const data = [];
  
  for (let i = 0; i < 30; i++) {
    // More likely to have workout on weekdays
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const dayOfWeek = date.getDay();
    
    // Weekend (0 = Sunday, 6 = Saturday)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      data.push(Math.random() > 0.7 ? 1 : 0);
    } else {
      // Weekday
      data.push(Math.random() > 0.3 ? 1 : 0);
    }
  }
  
  return data;
}

function generateRandomDurationData() {
  const data = [];
  const frequencyData = generateRandomFrequencyData();
  
  for (let i = 0; i < 30; i++) {
    if (frequencyData[i] === 1) {
      // If there was a workout, generate a duration between 30 and 90 minutes
      data.push(Math.floor(Math.random() * 61) + 30);
    } else {
      data.push(0);
    }
  }
  
  return data;
} 