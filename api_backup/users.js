// Users API endpoint
module.exports = (req, res) => {
  console.log(`Received ${req.method} request to /api/Users`);
  console.log('URL path:', req.url);
  console.log('Request body:', req.body);
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS requests (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Check if this is the /me endpoint
  if (req.url.includes('/me')) {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Missing or invalid authorization token'
      });
    }
    
    // In a real app, we would validate the token and extract user information
    // For this mock, we'll return a sample user profile
    return res.status(200).json({
      id: "user-123",
      auth0Id: "auth0|user123",
      name: "Demo User",
      email: "demo@example.com",
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2023-03-15T00:00:00Z"
    });
  }
  
  // For other user endpoints, return a mock user list
  const users = [
    {
      id: "user-123",
      name: "Demo User",
      email: "demo@example.com"
    },
    {
      id: "user-456",
      name: "Test User",
      email: "test@example.com"
    }
  ];
  
  // Return the response with the $values format that mimics the .NET response
  res.status(200).json({
    $id: "1",
    $values: users
  });
}; 