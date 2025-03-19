// Simple API endpoint to test environment variable access
module.exports = (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS requests (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  // Check for specific environment variables (without revealing sensitive values)
  const envStatus = {
    MONGODB_URI: {
      exists: !!process.env.MONGODB_URI,
      value: process.env.MONGODB_URI ? `${process.env.MONGODB_URI.substring(0, 15)}...` : null
    },
    // Check other important environment variables
    NODE_ENV: {
      exists: !!process.env.NODE_ENV,
      value: process.env.NODE_ENV
    }
  };
  
  // Log environment variable status (for debugging)
  console.log('Environment variable status:', JSON.stringify(envStatus, null, 2));
  console.log('All environment variable names:', Object.keys(process.env).join(', '));
  
  // Return the environment status
  return res.status(200).json({
    message: 'Environment variable check',
    envStatus,
    allVariables: Object.keys(process.env)
  });
}; 