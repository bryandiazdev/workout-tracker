import auth0 from 'auth0-js';
import DebugService from './DebugService';

// Configuration object to hold Auth0 settings
// This gets the environment variables at runtime
const getConfig = () => {
  // For Auth0 domain
  const domain = process.env.VUE_APP_AUTH0_DOMAIN;
  // For Auth0 client ID
  const clientID = process.env.VUE_APP_AUTH0_CLIENT_ID;
  // For Auth0 audience
  const audience = process.env.VUE_APP_AUTH0_AUDIENCE;
  // For callback URL
  const callbackUrl = process.env.VUE_APP_AUTH0_CALLBACK_URL || 'https://workout-tracker-rose.vercel.app/callback';
  
  // Log config for debugging
  console.log('Auth0 Configuration (masked):');
  console.log('Domain:', domain ? domain.substring(0, 5) + '...' : 'Not set');
  console.log('Client ID:', clientID ? clientID.substring(0, 5) + '...' : 'Not set');
  console.log('Audience:', audience ? audience.substring(0, 5) + '...' : 'Not set');
  console.log('Callback URL:', callbackUrl ? callbackUrl.substring(0, 10) + '...' : 'Not set');
  
  // Return the config
  return {
    domain,
    clientID,
    audience,
    callbackUrl,
    responseType: 'token id_token',
    scope: 'openid profile email'
  };
};

class AuthService {
  constructor() {
    const config = getConfig();
    
    // Log to debugging service
    DebugService.logAuth('Auth0 Configuration initialized', {
      domainSet: !!config.domain,
      clientIdSet: !!config.clientID,
      audienceSet: !!config.audience,
      redirectUri: config.callbackUrl
    });
    
    // Initialize Auth0 WebAuth with our config
    this.auth0 = new auth0.WebAuth({
      domain: config.domain,
      clientID: config.clientID,
      redirectUri: config.callbackUrl,
      audience: config.audience,
      responseType: config.responseType,
      scope: config.scope
    });

    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.handleAuthentication = this.handleAuthentication.bind(this);
    this.isAuthenticated = this.isAuthenticated.bind(this);
    this.getToken = this.getToken.bind(this);
    this.getUser = this.getUser.bind(this);
  }

  login() {
    console.log('Initiating Auth0 login flow...');
    DebugService.logAuth('Initiating Auth0 login flow');
    
    // Add state parameter for security
    const state = this.generateRandomString();
    localStorage.setItem('auth_state', state);
    
    // Generate a nonce for OIDC security
    const nonce = this.generateRandomString();
    
    console.log('Auth0 config being used:', {
      domain: this.auth0.baseOptions.domain,
      clientID: this.auth0.baseOptions.clientID ? '✓ Set (hidden)' : '✗ Not set',
      redirectUri: this.auth0.baseOptions.redirectUri,
      audience: this.auth0.baseOptions.audience,
      responseType: this.auth0.baseOptions.responseType,
      scope: this.auth0.baseOptions.scope,
      state: state
    });
    
    DebugService.logAuth('Auth0 configuration for login', {
      domain: this.auth0.baseOptions.domain,
      clientIDLength: this.auth0.baseOptions.clientID ? this.auth0.baseOptions.clientID.length : 0, // For security, only log the length
      redirectUri: this.auth0.baseOptions.redirectUri,
      audience: this.auth0.baseOptions.audience,
      responseType: this.auth0.baseOptions.responseType,
      scope: this.auth0.baseOptions.scope,
      state: state.substring(0, 5) + '...' // Log partial state for debugging
    });
    
    // Use the built-in authorize method instead of constructing URL manually
    this.auth0.authorize({
      state: state,
      nonce: nonce
    });
  }
  
  // Helper method to generate a random string for state parameter
  generateRandomString() {
    const crypto = window.crypto || window.msCrypto;
    const array = new Uint32Array(5);
    crypto.getRandomValues(array);
    return Array.from(array).map(n => n.toString(36)).join('');
  }

  handleAuthentication() {
    console.log('Starting Auth0 parseHash to handle authentication...');
    DebugService.logAuth('Starting authentication handler');
    return new Promise((resolve, reject) => {
      try {
        // Get hash from URL
        const hash = window.location.hash;
        console.log('Auth0 parseHash called with window.location.hash:', hash);
        DebugService.logAuth('Processing authentication callback', {
          hasHash: !!hash,
          hashLength: hash ? hash.length : 0,
          url: window.location.href.replace(/access_token=([^&]+)/, 'access_token=REDACTED')
        });
        
        // If hash is empty, there's no authentication data
        if (!hash || hash.length < 2) {
          console.warn('No hash present in URL, cannot authenticate');
          DebugService.logAuth('No hash present in URL, cannot authenticate');
          resolve(false);
          return;
        }
        
        // Try manual hash parsing as a fallback if auth0.js doesn't work
        if (hash.includes('access_token=') && hash.includes('id_token=')) {
          console.log('Attempting manual token extraction from hash');
          DebugService.logAuth('Attempting manual token extraction from hash');
          try {
            // Parse the hash manually
            const hashParams = {};
            hash.substring(1).split('&').forEach(param => {
              const [key, value] = param.split('=');
              hashParams[key] = decodeURIComponent(value);
            });
            
            console.log('Extracted hash params:', Object.keys(hashParams));
            DebugService.logAuth('Extracted hash params', { 
              keys: Object.keys(hashParams),
              hasAccessToken: !!hashParams.access_token,
              hasIdToken: !!hashParams.id_token,
              hasState: !!hashParams.state,
              hasExpiresIn: !!hashParams.expires_in
            });
            
            // Verify state parameter to prevent CSRF
            const originalState = localStorage.getItem('auth_state');
            if (originalState !== hashParams.state) {
              console.error('State parameter mismatch - possible CSRF attack');
              DebugService.logAuth('State parameter mismatch - possible CSRF attack', {
                originalState: originalState ? originalState.substring(0, 5) + '...' : 'null',
                receivedState: hashParams.state ? hashParams.state.substring(0, 5) + '...' : 'null'
              });
              resolve(false);
              return;
            }
            
            // Create a mock authResult
            const authResult = {
              accessToken: hashParams.access_token,
              idToken: hashParams.id_token,
              expiresIn: parseInt(hashParams.expires_in || '3600'),
              idTokenPayload: this.parseJwt(hashParams.id_token)
            };
            
            console.log('Manual authentication successful, setting session...');
            DebugService.logAuth('Manual authentication successful, setting session');
            this.setSession(authResult);
            resolve(true);
            return;
          } catch (manualError) {
            console.error('Manual token extraction failed:', manualError);
            DebugService.logAuth('Manual token extraction failed', { 
              error: manualError.message,
              stack: manualError.stack
            });
          }
        }
        
        // Fall back to auth0.js parseHash
        this.auth0.parseHash((err, authResult) => {
          console.log('parseHash callback executed');
          DebugService.logAuth('Auth0 parseHash callback executed');
          
          if (authResult && authResult.accessToken && authResult.idToken) {
            console.log('Authentication successful, setting session...');
            console.log('Auth tokens received:', {
              accessToken: authResult.accessToken ? 'Present (not showing for security)' : 'Missing',
              idToken: authResult.idToken ? 'Present (not showing for security)' : 'Missing',
              expiresIn: authResult.expiresIn
            });
            
            DebugService.logAuth('Authentication successful', {
              hasAccessToken: !!authResult.accessToken,
              hasIdToken: !!authResult.idToken,
              expiresIn: authResult.expiresIn
            });
            
            this.setSession(authResult);
            resolve(true);
          } else if (err) {
            console.error('Authentication error:', err);
            console.error('Error details:', JSON.stringify(err, null, 2));
            
            DebugService.logAuth('Authentication error', {
              error: err.error || 'unknown_error',
              errorDescription: err.errorDescription || 'No description',
              statusCode: err.statusCode
            });
            
            // Check specific error types
            if (err.error === 'invalid_grant') {
              console.error('Invalid grant - this could be due to expired authorization code or already used code');
              DebugService.logAuth('Invalid grant error');
            } else if (err.error === 'unauthorized') {
              console.error('Unauthorized - check audience, client ID permissions');
              DebugService.logAuth('Unauthorized error');
            }
            
            reject(err);
          } else {
            console.warn('No authentication result or error received');
            console.warn('This might happen if the callback URL does not match what was configured in Auth0');
            console.warn('Check that http://localhost:8080/callback is set up correctly in Auth0 dashboard');
            
            DebugService.logAuth('No authentication result or error received');
            resolve(false);
          }
        });
      } catch (parseError) {
        console.error('Error calling parseHash:', parseError);
        DebugService.logAuth('Error calling parseHash', { 
          error: parseError.message,
          stack: parseError.stack
        });
        reject(parseError);
      }
    });
  }
  
  // Helper method to parse JWT token
  parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Error parsing JWT:', e);
      DebugService.logAuth('Error parsing JWT', { error: e.message });
      return {};
    }
  }

  setSession(authResult) {
    // Set the time that the access token will expire at
    const expiresAt = JSON.stringify(
      authResult.expiresIn * 1000 + new Date().getTime()
    );
    
    localStorage.setItem('auth_token', authResult.accessToken);
    localStorage.setItem('id_token', authResult.idToken);
    localStorage.setItem('expires_at', expiresAt);
    localStorage.setItem('user_profile', JSON.stringify(authResult.idTokenPayload));
    
    DebugService.logAuth('Authentication session set', {
      expiresAt: new Date(JSON.parse(expiresAt)).toLocaleString(),
      hasAccessToken: !!authResult.accessToken,
      hasIdToken: !!authResult.idToken,
      hasUserProfile: !!authResult.idTokenPayload
    });
  }

  logout() {
    return new Promise((resolve, reject) => {
      try {
        // Clear all stored items from localStorage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('id_token');
        localStorage.removeItem('expires_at');
        localStorage.removeItem('user_profile');
        localStorage.removeItem('user_state');
        localStorage.removeItem('auth_state');
        
        console.log('Logout complete: cleared all auth-related localStorage items');
        DebugService.logAuth('Logout complete: cleared all auth-related localStorage items');
        
        // Use client-side logout approach to avoid Auth0 returnTo URL configuration issues
        console.log('Using client-side logout approach');
        DebugService.logAuth('Using client-side logout approach');
        
        // Set a flag to indicate client-side logout was performed
        sessionStorage.setItem('performed_client_logout', 'true');
        
        // Success - resolve with no redirection (let the caller handle redirects)
        resolve();
      } catch (error) {
        console.error('Error during logout process:', error);
        DebugService.logAuth('Error during logout process', { error: error.message });
        
        // Reject with the error to propagate it back to the caller
        reject(error);
      }
    });
  }

  isAuthenticated() {
    // Check whether the current time is past the access token's expiry time
    const expiresAt = JSON.parse(localStorage.getItem('expires_at') || '0');
    const token = localStorage.getItem('auth_token');
    const currentTime = new Date().getTime();
    const isExpired = currentTime >= expiresAt;
    const isAuth = currentTime < expiresAt && !!token;
    
    console.log('Detailed Auth check:', {
      hasToken: !!token,
      expiresAt: expiresAt ? new Date(expiresAt).toLocaleString() : 'not set',
      currentTime: new Date(currentTime).toLocaleString(),
      isExpired: isExpired,
      timeRemaining: expiresAt ? Math.floor((expiresAt - currentTime) / 1000 / 60) + ' minutes' : 'N/A',
      isAuthenticated: isAuth
    });
    
    return isAuth;
  }

  getToken() {
    return localStorage.getItem('auth_token');
  }

  async getUser() {
    // If we have a user profile in localStorage, use that
    const userProfile = localStorage.getItem('user_profile');
    if (userProfile) {
      DebugService.logAuth('Retrieved user from localStorage');
      return JSON.parse(userProfile);
    }
    
    // Otherwise, fetch the user from the API
    try {
      DebugService.logAuth('Fetching user data from API');
      const apiUrl = process.env.VUE_APP_API_URL || 'https://localhost:7250/api';
      const response = await fetch(`${apiUrl}/Users/me`, {
        headers: {
          'Authorization': `Bearer ${this.getToken()}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        DebugService.logAuth('User data fetched successfully from API');
        return userData;
      } else {
        DebugService.logAuth('Failed to fetch user from API', {
          status: response.status,
          statusText: response.statusText
        });
        throw new Error('Failed to fetch user');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      DebugService.logAuth('Error fetching user', { 
        error: error.message,
        stack: error.stack
      });
      return null;
    }
  }

  resetPassword(email) {
    return new Promise((resolve, reject) => {
      this.auth0.changePassword({
        connection: 'Username-Password-Authentication',
        email: email
      }, (err, resp) => {
        if (err) {
          reject(err);
        } else {
          resolve(resp);
        }
      });
    });
  }
}

// Create a singleton instance
const authService = new AuthService();

export default authService; 