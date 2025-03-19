// Health check endpoint
module.exports = (req, res) => {
  console.log(`Received ${req.method} request to /api/health`);
  console.log('URL path:', req.url);
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS requests (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Check if this is the /auth subpath
  if (req.url.includes('/auth')) {
    // This is the authenticated endpoint
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Missing or invalid authorization token',
        authenticated: false
      });
    }
    
    // Extract token (in a real app, we would validate this)
    const token = authHeader.split(' ')[1];
    
    // For debugging, check if we have a token
    if (!token) {
      return res.status(401).json({ 
        message: 'No token provided',
        authenticated: false
      });
    }
    
    // Return a successful auth response
    return res.status(200).json({
      message: 'Successfully authenticated',
      authenticated: true,
      userId: 'user-123', // Mock user ID
      timestamp: new Date().toISOString()
    });
  }
  
  // For the main health endpoint, return a simple response
  res.status(200).json({
    status: 'healthy',
    message: 'API is operational',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    serverTime: new Date().toLocaleString()
  });
}; 