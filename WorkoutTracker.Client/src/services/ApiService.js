import AuthService from './AuthService';
import NotificationService from './NotificationService';
import DebugService from './DebugService';
import axios from 'axios';

// API base URL configuration - ALWAYS use relative URL to work with Vercel deployment
// Never use localhost in production
const API_URL = '/api';

// Create axios instance with configuration
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000
});

// Add authorization interceptor
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Log the API URL for debugging purposes
console.log('API URL being used:', API_URL);
DebugService.logApi('API URL configured', { url: API_URL });

// Flag to indicate if we should use mock data when API is unreachable
const USE_MOCK_DATA_WHEN_API_DOWN = true;

// Generate workout frequency data - extracting this outside MOCK_DATA to avoid circular references
const generateWorkoutFrequencyData = () => {
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
  
  return data;
};

// Generate the frequency data first
const workoutFrequencyData = generateWorkoutFrequencyData();

// Generate workout duration data based on frequency data
const generateWorkoutDurationData = (frequencyData) => {
  // Generate 30 days of workout duration data
  const today = new Date();
  const data = {};
  
  // Use the same dates as workout frequency
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(today.getDate() - (29 - i));
    
    const dateStr = date.toISOString().split('T')[0];
    
    // If there was a workout on this day, assign a duration
    if (dateStr in frequencyData && frequencyData[dateStr] > 0) {
      // Generate realistic durations between 30 and 90 minutes
      // Different workout types have different typical durations
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
      
      // For days with 2 workouts, increase duration
      if (frequencyData[dateStr] === 2) {
        data[dateStr] = Math.round(data[dateStr] * 1.5);
      }
    } else {
      // No workout, no duration
      data[dateStr] = 0;
    }
  }
  
  return data;
};

// Mock data for development when API is unreachable
const MOCK_DATA = {
  'Goals': [
    { 
      Id: 1, 
      Name: 'Lose Weight', 
      Description: 'Reduce body weight through diet and exercise',
      StartDate: '2023-01-01', 
      TargetDate: '2023-12-31', 
      StartingValue: 80,
      CurrentValue: 75, 
      TargetValue: 70, 
      MetricType: 'weight',
      Unit: 'kg', 
      IsCompleted: false,
      User: 'user'
    },
    { 
      Id: 2, 
      Name: 'Run Marathon', 
      Description: 'Complete a full marathon',
      StartDate: '2023-02-01', 
      TargetDate: '2023-10-31', 
      StartingValue: 0,
      CurrentValue: 15, 
      TargetValue: 42, 
      MetricType: 'distance',
      Unit: 'km', 
      IsCompleted: false,
      User: 'user'
    },
    { 
      Id: 3, 
      Name: 'Increase Bench Press', 
      Description: 'Improve strength by increasing bench press weight',
      StartDate: '2023-01-15', 
      TargetDate: '2023-11-30', 
      StartingValue: 60,
      CurrentValue: 80, 
      TargetValue: 100, 
      MetricType: 'strength',
      Unit: 'kg', 
      IsCompleted: false,
      User: 'user'
    }
  ],
  'WorkoutPlans': [
    { id: 1, name: 'Full Body Workout', description: 'Works all major muscle groups', frequency: 'Every other day', exercises: [] },
    { id: 2, name: 'Cardio Routine', description: 'High intensity cardio training', frequency: '3 times per week', exercises: [] },
    { id: 3, name: 'Upper/Lower Split', description: 'Focus on upper body one day, lower body next', frequency: '4 times per week', exercises: [] },
    { id: 4, name: 'Push/Pull/Legs', description: 'Classic bodybuilding split', frequency: '6 times per week', exercises: [] }
  ],
  'WorkoutLogs': [
    { 
      id: 1, 
      workoutDate: '2023-05-15', 
      duration: 60, 
      notes: 'Good progress today', 
      exerciseLogs: [
        { id: 1, name: 'Bench Press', sets: 3, reps: 10, weight: 80, weightUnit: 'kg' },
        { id: 2, name: 'Squats', sets: 4, reps: 8, weight: 100, weightUnit: 'kg' },
        { id: 3, name: 'Pull-ups', sets: 3, reps: 8, weight: null, weightUnit: 'kg' }
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
        { id: 4, name: 'Treadmill', sets: 1, reps: 1, weight: null, weightUnit: 'kg', duration: 30 },
        { id: 5, name: 'Jump Rope', sets: 3, reps: 1, weight: null, weightUnit: 'kg', duration: 5 }
      ], 
      workoutPlanId: 2,
      workoutPlan: { id: 2, name: 'Cardio Routine' } 
    }
  ],
  // Handle workoutLog POST/PUT correctly
  'WorkoutLogs/post': {
    id: 3,
    workoutDate: new Date().toISOString().split('T')[0],
    duration: 60,
    notes: 'Mock workout log created by offline mode',
    exerciseLogs: [],
    workoutPlanId: 1,
    workoutPlan: { id: 1, name: 'Full Body Workout' }
  },
  'Stats/summary': {
    totalWorkouts: 25,
    workoutsLast7Days: 3,
    totalWorkoutHours: 35,
    activeGoals: 3,
    favoriteExercises: ['Bench Press', 'Squats', 'Deadlift'],
    weeklyProgress: 15, // percentage increase
    streakDays: 3
  },
  'Stats/workout-frequency': workoutFrequencyData,
  'Stats/workout-duration': generateWorkoutDurationData(workoutFrequencyData),
  'Stats/exercise-types': {
    'Strength Training': 42,
    'Cardio': 35,
    'Flexibility': 15,
    'HIIT': 8
  },
  'Stats/muscle-groups': {
    'Chest': 22,
    'Back': 25,
    'Legs': 30,
    'Arms': 18,
    'Shoulders': 15,
    'Core': 20
  },
  // Handle goal POST operations
  'Goals/post': {
    Id: 4,
    Name: 'New Goal',
    Description: 'Goal created from mock data',
    StartDate: new Date().toISOString(),
    TargetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    StartingValue: 0,
    CurrentValue: 0,
    TargetValue: 50,
    MetricType: 'weight',
    Unit: 'kg',
    IsCompleted: false,
    User: 'user'
  }
};

class ApiService {
  async get(endpoint) {
    return this.request(endpoint, 'GET');
  }

  async post(endpoint, data) {
    return this.request(endpoint, 'POST', data);
  }

  async put(endpoint, data) {
    return this.request(endpoint, 'PUT', data);
  }

  async delete(endpoint) {
    return this.request(endpoint, 'DELETE');
  }

  async request(endpoint, method, data = null) {
    const url = `${API_URL}/${endpoint}`;
    const isGoalRequest = endpoint.startsWith('Goals');
    
    // Add detailed token diagnostic info
    const token = AuthService.getToken();
    const tokenIsValid = AuthService.isAuthenticated();
    const tokenExp = localStorage.getItem('expires_at');
    const currentTime = new Date().getTime();
    const expiresAt = tokenExp ? JSON.parse(tokenExp) : 0;
    const timeRemaining = tokenExp ? Math.floor((expiresAt - currentTime) / 1000 / 60) : 0;
    
    console.log(`${method} request to ${endpoint}:`, {
      url,
      method,
      tokenStatus: {
        hasToken: !!token,
        isAuthenticated: tokenIsValid,
        expiresIn: timeRemaining + ' minutes',
        tokenLength: token ? token.length : 0,
        audience: token ? (JSON.parse(atob(token.split('.')[1])).aud || 'unknown') : 'no token'
      }
    });
    
    if (isGoalRequest) {
      console.log(`${method} request to Goals endpoint:`, {
        url,
        method,
        data: data ? JSON.stringify(data).substring(0, 200) + (JSON.stringify(data).length > 200 ? '...' : '') : null,
        token: AuthService.getToken() ? 'Present (first 20 chars: ' + AuthService.getToken().substring(0, 20) + '...)' : 'Not present',
        isAuthenticated: AuthService.isAuthenticated()
      });
      
      // Special handling for Goal POST/PUT requests
      if ((method === 'POST' || method === 'PUT') && data) {
        // Log the complete goal request structure for debugging
        console.log(`Complete Goal ${method} request data:`, JSON.stringify(data, null, 2));
        
        // Ensure the data follows the API's required format
        if (data.goal) {
          console.warn('Legacy goal data format detected (wrapped in goal object). API now expects root-level properties.');
          
          // Extract the goal data from the wrapper
          const unwrappedData = data.goal;
          
          // Update the data to be used for the API call
          data = unwrappedData;
          
          console.log('Unwrapped goal data to be sent:', JSON.stringify(data, null, 2));
        }
        
        // Ensure all required fields are present with proper capitalization
        if (isGoalRequest) {
          if (!data.Name && data.name) data.Name = data.name;
          if (!data.Description && data.description) data.Description = data.description;
          if (!data.Unit && data.unit) data.Unit = data.unit;
          
          // Ensure User field is set
          if (!data.User) {
            // Try to get user from localStorage
            try {
              const userProfile = localStorage.getItem('user_profile');
              if (userProfile) {
                const profile = JSON.parse(userProfile);
                data.User = {
                  Auth0Id: profile.sub || profile.email || "user"
                };
              } else {
                data.User = { Auth0Id: "user" }; // Fallback value
              }
            } catch (e) {
              console.error("Error retrieving user profile:", e);
              data.User = { Auth0Id: "user" }; // Fallback value
            }
          } else if (typeof data.User === 'string') {
            // If User is a string, convert it to the expected object format
            data.User = { Auth0Id: data.User };
          }
          
          console.log('Final goal data to be sent:', JSON.stringify(data, null, 2));
        }
      }
    }
    
    DebugService.logApi(`${method} request to ${endpoint}`, { fullUrl: url });
    
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      // Add auth token if user is authenticated
      if (token) {
        // Always include the token if we have one, regardless of isAuthenticated status
        // This will help diagnose token validation issues
        headers['Authorization'] = `Bearer ${token}`;
        
        DebugService.logApi('Using auth token for API request', {
          hasToken: true,
          tokenStart: token.substring(0, 15) + '...',
          tokenExpired: !tokenIsValid,
          timeRemaining: timeRemaining + ' minutes'
        });
        
        // Log token details for diagnostic purposes
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            console.log('Token payload:', {
              iss: payload.iss,
              aud: payload.aud,
              exp: new Date(payload.exp * 1000).toLocaleString(),
              iat: new Date(payload.iat * 1000).toLocaleString(),
              scopes: payload.scope
            });
          }
        } catch (tokenError) {
          console.error('Error parsing token:', tokenError);
        }
      } else {
        DebugService.logApi('User is not authenticated, making unauthenticated request');
      }
      
      const config = {
        method,
        headers,
        mode: 'cors', // Explicitly set CORS mode
        credentials: 'include' // Include cookies if needed
      };
      
      if (data) {
        config.body = JSON.stringify(data);
      }
      
      DebugService.logApi(`Sending request to ${url}`, { 
        headers: Object.keys(headers),
        method,
        config: JSON.stringify(config)
      });
      
      // Make the actual API request
      const response = await fetch(url, config);
      
      DebugService.logApi(`Response received from ${endpoint}`, { 
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries([...response.headers].map(([key, value]) => [key, value]))
      });
      
      // Handle unauthorized requests
      if (response.status === 401) {
        DebugService.logApi(`Unauthorized response (401) from ${endpoint}`, {
          headers: Object.fromEntries([...response.headers]),
        });
        
        // Special handling for goals with 401 error
        if (isGoalRequest) {
          console.error('Authentication failed when accessing Goals API. Details:', {
            endpoint, 
            method,
            hasToken: !!AuthService.getToken(),
            tokenExpired: !AuthService.isAuthenticated()
          });
          
          // If the token is definitely expired, notify the user
          if (AuthService.getToken() && !AuthService.isAuthenticated()) {
            NotificationService.showError('Your session has expired. Please log in again.');
            return {
              error: 'token_expired',
              status: 401,
              message: 'Authentication token has expired'
            };
          }
        }
        
        // Only show the authentication error in production mode
        // If mock data is enabled, we'll fall back to that instead of showing errors
        if (!USE_MOCK_DATA_WHEN_API_DOWN) {
          NotificationService.showError('Authentication error: Your session appears to be invalid.');
        }
        
        // Don't automatically logout and redirect - this was causing the redirect loop
        // Instead, just return the error so we can handle it appropriately
        return {
          error: 'unauthorized',
          status: 401,
          message: 'Authentication failed'
        };
      }
      
      // Handle bad requests - add more details for Goals
      if (response.status === 400) {
        const error = await this.handleErrorResponse(response);
        
        if (isGoalRequest) {
          console.error('Bad request when creating/updating goal:', {
            status: 400,
            details: JSON.stringify(error),
            sentData: data ? JSON.stringify(data) : 'No data',
          });
        }
        
        DebugService.logApi(`Error response (400) from ${endpoint}`, error);
        throw error;
      }
      
      // For delete requests or requests that don't return content
      if (response.status === 204) {
        DebugService.logApi(`No content response (204) from ${endpoint}`);
        return true;
      }
      
      // For successful requests with content
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        DebugService.logApi(`Successful response from ${endpoint}`, {
          contentType
        });
        
        if (contentType && contentType.includes('application/json')) {
          const jsonResult = await response.json();
          DebugService.logApi(`JSON data received from ${endpoint}`);
          return jsonResult;
        }
        
        const textResult = await response.text();
        DebugService.logApi(`Text data received from ${endpoint}`);
        return textResult;
      }
      
      // Handle errors
      const error = await this.handleErrorResponse(response);
      DebugService.logApi(`Error response from ${endpoint}`, error);
      throw error;
    } catch (error) {
      DebugService.logApi(`API Error (${method} ${url})`, {
        message: error.message,
        stack: error.stack
      });
      console.error(`API Error (${method} ${url}):`, error);
      
      // If API is unreachable and we are using mock data, return it
      if (USE_MOCK_DATA_WHEN_API_DOWN && 
          (error.message === 'Failed to fetch' || 
           error.message.includes('ECONNREFUSED') || 
           error.message.includes('Network Error'))) {
        
        // Special handling for POST/PUT requests
        if (method === 'POST' || method === 'PUT') {
          // If we're creating a workout log, use the special post mock
          if (endpoint === 'WorkoutLogs' && method === 'POST' && MOCK_DATA['WorkoutLogs/post']) {
            console.warn(`API is unreachable. Using mock data for ${endpoint} POST`);
            
            // Extract the workout log data from the request
            const requestData = data?.workoutLog || data;
            
            // Create a new mock response with a combination of the template and the request data
            const mockResponse = {
              ...MOCK_DATA['WorkoutLogs/post'],
              ...requestData,
              // Ensure ID is an integer
              id: typeof requestData.id === 'number' ? requestData.id : 
                  Math.floor(Math.random() * 1000) + 100
            };
            
            NotificationService.showWarning(`Using offline mock data for ${endpoint} (POST)`);
            return mockResponse;
          }
          
          // If we're creating a goal, use the special post mock
          if (endpoint === 'Goals' && method === 'POST' && MOCK_DATA['Goals/post']) {
            console.warn(`API is unreachable. Using mock data for ${endpoint} POST`);
            
            // Extract the goal data from the request
            const requestData = data?.goal || data;
            
            // Create a new mock response with a combination of the template and the request data
            const mockResponse = {
              ...MOCK_DATA['Goals/post'],
              ...requestData,
              // Ensure ID is an integer
              id: typeof requestData.id === 'number' ? requestData.id : 
                  Math.floor(Math.random() * 1000) + 100
            };
            
            NotificationService.showWarning(`Using offline mock data for ${endpoint} (POST)`);
            return mockResponse;
          }
          
          // For other POST/PUT requests, just return the data that was sent, with an ID
          console.warn(`API is unreachable. Echoing input data for ${endpoint} ${method}`);
          const mockResponse = {
            ...(typeof data === 'object' ? data : {}),
            id: data?.id || Math.floor(Math.random() * 1000) + 100,
            createdAt: new Date().toISOString(),
            isMockData: true
          };
          
          NotificationService.showWarning(`Using offline echo mode for ${endpoint} (${method})`);
          return mockResponse;
        }
        
        // Check if we have mock data for this endpoint
        // First try exact endpoint match
        if (MOCK_DATA[endpoint]) {
          console.warn(`API is unreachable. Using mock data for ${endpoint}`);
          NotificationService.showWarning(`Using offline mock data for ${endpoint}`);
          return MOCK_DATA[endpoint];
        }
        
        // Then try to match by the base path (first segment of the endpoint)
        const basePath = endpoint.split('/')[0];
        if (MOCK_DATA[basePath]) {
          console.warn(`API is unreachable. Using mock data for ${basePath}`);
          NotificationService.showWarning(`Using offline mock data for ${basePath}`);
          return MOCK_DATA[basePath];
        }
        
        console.warn(`No mock data available for ${endpoint}`);
        NotificationService.showWarning(`API is unreachable and no mock data is available for ${endpoint}`);
      }
      
      throw error;
    }
  }
  
  async handleErrorResponse(response) {
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        return {
          status: response.status,
          message: errorData.message || errorData.title || 'An error occurred',
          details: errorData.errors || errorData.detail || null
        };
      } else {
        const errorText = await response.text();
        return {
          status: response.status,
          message: errorText || `HTTP Error: ${response.status}`
        };
      }
    } catch (error) {
      return {
        status: response.status,
        message: `HTTP Error: ${response.status}`
      };
    }
  }
}

export default new ApiService(); 