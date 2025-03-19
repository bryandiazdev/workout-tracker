// Authentication Fix Script
// This script helps diagnose and fix common Auth0 token issues

(function() {
  console.log('Running Auth0 token fix...');
  
  // Check if we need to run the fix
  const authToken = localStorage.getItem('auth_token');
  const idToken = localStorage.getItem('id_token');
  const expiresAt = localStorage.getItem('expires_at');
  const userProfile = localStorage.getItem('user_profile');
  
  // Get API URL - always use relative URL
  const apiUrl = '/api';
  
  console.log('Current auth state:', {
    hasAuthToken: !!authToken,
    hasIdToken: !!idToken,
    hasExpiresAt: !!expiresAt,
    hasUserProfile: !!userProfile
  });
  
  // Check if the token is expired
  if (expiresAt) {
    const expiryTime = JSON.parse(expiresAt);
    const currentTime = new Date().getTime();
    const isExpired = currentTime >= expiryTime;
    
    console.log('Token expiration status:', {
      expiresAt: new Date(expiryTime).toLocaleString(),
      currentTime: new Date(currentTime).toLocaleString(),
      isExpired: isExpired,
      timeRemaining: isExpired ? 'Expired' : Math.floor((expiryTime - currentTime) / 1000 / 60) + ' minutes'
    });
    
    if (isExpired) {
      console.warn('WARNING: Authentication token is expired! You need to log in again.');
      alert('Your session has expired. Please log in again.');
      
      // Clear tokens and redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('id_token');
      localStorage.removeItem('expires_at');
      localStorage.removeItem('user_profile');
      localStorage.removeItem('user_state');
      localStorage.removeItem('auth_state');
      
      window.location.href = '/login';
      return;
    }
  }
  
  // If we have a token but API calls are failing with 401, try to fix the token format
  if (authToken) {
    // Ensure auth_token is properly stored (without any wrapping quotes)
    if (authToken.startsWith('"') && authToken.endsWith('"')) {
      const fixedToken = authToken.slice(1, -1);
      console.log('Fixing malformed token (removing quotes)');
      localStorage.setItem('auth_token', fixedToken);
    }
    
    // Test a simple API call to see if the token works
    fetch(`${apiUrl}/health`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    })
    .then(response => {
      console.log('API health check result:', {
        status: response.status,
        ok: response.ok
      });
      
      if (response.status === 401) {
        console.error('Token still not working with API - you may need to log in again');
      } else if (response.ok) {
        console.log('Token is working correctly with the API!');
      }
    })
    .catch(error => {
      console.error('Error testing API connection:', error.message);
    });
  }
})();

// Add to window for manual invocation
window.fixAuth = function() {
  // Get API URL - always use relative URL
  const apiUrl = '/api';
  
  // Re-run the same checks
  console.log('Manually running auth fix...');
  
  // Check if the backend API is reachable at all (without auth)
  fetch(`${apiUrl}/health`)
    .then(response => {
      console.log('API health check (no auth):', {
        status: response.status,
        ok: response.ok
      });
    })
    .catch(error => {
      console.error('API appears to be unreachable:', error.message);
    });
}; 