// Main API entry point
module.exports = (req, res) => {
  res.status(200).json({
    message: 'Workout Tracker API is running',
    endpoints: [
      '/api/health',
      '/api/workout-logs',
      '/api/workout-plans',
      '/api/stats',
      '/api/goals'
    ]
  });
}; 