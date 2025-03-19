import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import { createStore } from 'vuex';
import App from './App.vue';
import Home from './views/Home.vue';
import Login from './views/Login.vue';
import Dashboard from './views/Dashboard.vue';
import WorkoutPlans from './views/WorkoutPlans.vue';
import WorkoutLogs from './views/WorkoutLogs.vue';
import Goals from './views/Goals.vue';
import Profile from './views/Profile.vue';
import AuthService from './services/AuthService';
import NotificationService from './services/NotificationService';
import ApiService from './services/ApiService';
import Callback from './views/Callback.vue';
import Debug from './views/Debug.vue';
import AuthConfig from './views/AuthConfig.vue';
import DebugService from './services/DebugService';

// Router configuration
const routes = [
  { path: '/', component: Home },
  { path: '/login', component: Login },
  { 
    path: '/dashboard', 
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  { 
    path: '/workout-plans', 
    component: WorkoutPlans,
    meta: { requiresAuth: true }
  },
  { 
    path: '/workout-logs', 
    component: WorkoutLogs,
    meta: { requiresAuth: true }
  },
  { 
    path: '/goals', 
    component: Goals,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    component: Profile,
    meta: { requiresAuth: true }
  },
  // Callback route for Auth0
  { 
    path: '/callback', 
    component: Callback 
  },
  // Debug route
  {
    path: '/debug',
    component: Debug
  },
  // Auth configuration help route
  { 
    path: '/auth-config', 
    component: AuthConfig 
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation guard for auth protected routes
router.beforeEach(async (to, from, next) => {
  console.log(`NAVIGATION GUARD: ${from.path} → ${to.path} (requires auth: ${to.matched.some(record => record.meta.requiresAuth)})`);
  DebugService.logNavigation(`Route change: ${from.path} → ${to.path}`, {
    requiresAuth: to.matched.some(record => record.meta.requiresAuth)
  });
  
  // If going to the login page, always allow
  if (to.path === '/login') {
    console.log('Navigating to login page - access granted');
    DebugService.logNavigation('Login page access granted');
    next();
    return;
  }
  
  // If going to debug page, always allow (for troubleshooting purposes)
  if (to.path === '/debug') {
    console.log('Navigating to debug page - access granted');
    DebugService.logNavigation('Debug page access granted');
    next();
    return;
  }
  
  // Skip auth check if coming from the callback page to dashboard
  // This prevents auth issues during the initial post-authentication redirect
  const isFromCallback = from.path === '/callback';
  if (isFromCallback && to.path === '/dashboard') {
    console.log('SPECIAL CASE: Coming directly from callback to dashboard - allowing access');
    DebugService.logNavigation('Allowing direct callback → dashboard navigation');
    next();
    return;
  }
  
  // For routes that require authentication
  if (to.matched.some(record => record.meta.requiresAuth)) {
    console.log(`Protected route access attempt: ${to.path}`);
    DebugService.logNavigation(`Protected route access: ${to.path}`);
    
    // Check all auth state info
    const token = localStorage.getItem('auth_token');
    const idToken = localStorage.getItem('id_token');
    const expiresAt = localStorage.getItem('expires_at');
    const userProfile = localStorage.getItem('user_profile');
    const userState = localStorage.getItem('user_state');
    const isAuth = AuthService.isAuthenticated();
    
    // Detailed logging
    const authState = {
      isAuthenticated: isAuth,
      hasAccessToken: !!token,
      hasIdToken: !!idToken,
      hasExpiresAt: !!expiresAt,
      hasUserProfile: !!userProfile,
      hasUserState: !!userState,
      currentPath: to.path,
      fromPath: from.path,
      userInStore: store.state.user ? 'Present' : 'Missing',
      currentTime: new Date().toLocaleString(),
      expiresAt: expiresAt ? new Date(JSON.parse(expiresAt)).toLocaleString() : 'not set'
    };
    
    console.log('DETAILED AUTH CHECK:', authState);
    DebugService.logNavigation('Authentication check', authState);
    
    // If we have a token, consider the user authenticated for navigation purposes
    // This is less restrictive than before
    if (token) {
      console.log('Access token exists, granting access to protected route');
      DebugService.logNavigation('Token exists, granting access');
      
      // Try to hydrate user data if needed, but don't block navigation
      if (!store.state.user) {
        console.log('User data not loaded, attempting to hydrate user data in background...');
        DebugService.logNavigation('Hydrating user data in background');
        
        // Try to get user data from profile or localStorage first
        if (userProfile) {
          console.log('Using cached user profile from localStorage');
          store.commit('setUser', JSON.parse(userProfile));
        } 
        // Only try API if we must - but don't block navigation on this
        else {
          // Fire and forget - don't await
          store.dispatch('fetchUser').catch(error => {
            console.error('Background user data fetch failed:', error);
          });
        }
      }
      
      // Refresh data when visiting certain pages
      if (to.path === '/workout-plans') {
        console.log('Refreshing workout plans data from API');
        store.dispatch('fetchWorkoutPlans').catch(error => {
          console.error('Failed to fetch workout plans:', error);
        });
      } else if (to.path === '/workout-logs') {
        console.log('Refreshing workout logs data from API');
        store.dispatch('fetchWorkoutLogs').catch(error => {
          console.error('Failed to fetch workout logs:', error);
        });
      } else if (to.path === '/goals') {
        console.log('Refreshing goals data from API');
        store.dispatch('fetchGoals').catch(error => {
          console.error('Failed to fetch goals:', error);
        });
      } else if (to.path === '/dashboard') {
        console.log('Refreshing all data for dashboard');
        // Fetch all data for dashboard
        Promise.all([
          store.dispatch('fetchWorkoutPlans'),
          store.dispatch('fetchWorkoutLogs'),
          store.dispatch('fetchGoals'),
          store.dispatch('fetchStats')
        ]).catch(error => {
          console.error('Failed to fetch dashboard data:', error);
        });
      }
      
      // Allow navigation regardless of user data state
      next();
    } 
    // No token means not authenticated
    else {
      console.log(`ACCESS DENIED: No valid token, redirecting to login`);
      DebugService.logNavigation('Access denied, redirecting to login');
      next('/login');
    }
  } 
  // For public routes
  else {
    console.log(`Public route access: proceeding to ${to.path}`);
    DebugService.logNavigation(`Public route access: ${to.path}`);
    next();
  }
});

// Function to save store state to localStorage
const saveState = (state) => {
  try {
    // Create a clean copy to avoid storing reactive objects
    const stateToSave = {
      workoutPlans: state.workoutPlans || [],
      workoutLogs: state.workoutLogs || [],
      goals: state.goals || [],
      // Save user info and auth status
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      // Don't save notification state or other ephemeral data
    };
    
    console.log('Saving state to localStorage:', stateToSave);
    console.log('workoutPlans count:', stateToSave.workoutPlans.length);
    console.log('workoutLogs count:', stateToSave.workoutLogs.length);
    
    const serializedState = JSON.stringify(stateToSave);
    localStorage.setItem('workout_tracker_state', serializedState);
    console.log('Store state saved to localStorage (size: ' + serializedState.length + ' bytes)');
  } catch (err) {
    console.error('Could not save state to localStorage:', err);
  }
};

// Function to load store state from localStorage
const loadState = () => {
  try {
    const serializedState = localStorage.getItem('workout_tracker_state');
    if (serializedState === null) {
      console.log('No saved state found in localStorage');
      return undefined;
    }
    
    const loadedState = JSON.parse(serializedState);
    console.log('Loaded state from localStorage:', loadedState);
    console.log('workoutPlans count:', loadedState.workoutPlans ? loadedState.workoutPlans.length : 0);
    console.log('workoutLogs count:', loadedState.workoutLogs ? loadedState.workoutLogs.length : 0);
    
    return loadedState;
  } catch (err) {
    console.error('Could not load state from localStorage:', err);
    // If loading fails, clear the corrupted state
    localStorage.removeItem('workout_tracker_state');
    return undefined;
  }
};

// Create store with saved state if available
const savedState = loadState();
const store = createStore({
  state() {
    // Load user from localStorage if available
    const savedUser = localStorage.getItem('user_state');
    // Check if authenticated based on token existence
    const hasToken = !!localStorage.getItem('auth_token');
    
    // Default state
    const defaultState = {
      user: savedUser ? JSON.parse(savedUser) : null,
      isAuthenticated: hasToken,
      workoutPlans: [],
      workoutLogs: [],
      goals: [],
      stats: null,
      notification: {
        show: false,
        message: '',
        type: 'info', // info, success, warning, error
        timeout: 5000
      },
      debug: {
        logs: []
      }
    };
    
    // If we have saved state, merge it with default state
    if (savedState) {
      console.log('Merging saved state with default state');
      
      // Ensure we're only overwriting properties that exist in the default state
      // and that collections are always arrays
      if (Array.isArray(savedState.workoutPlans)) {
        defaultState.workoutPlans = savedState.workoutPlans;
      }
      
      if (Array.isArray(savedState.workoutLogs)) {
        defaultState.workoutLogs = savedState.workoutLogs;
      }
      
      if (Array.isArray(savedState.goals)) {
        defaultState.goals = savedState.goals;
      }
      
      // Keep the auth state consistent
      if (savedState.user) {
        defaultState.user = savedState.user;
      }
      
      defaultState.isAuthenticated = hasToken;
    }
    
    return defaultState;
  },
  mutations: {
    setUser(state, user) {
      state.user = user;
      // Save user to localStorage for persistence
      if (user) {
        localStorage.setItem('user_state', JSON.stringify(user));
        state.isAuthenticated = true;
      } else {
        localStorage.removeItem('user_state');
        state.isAuthenticated = false;
      }
    },
    setAuthenticated(state, isAuthenticated) {
      state.isAuthenticated = isAuthenticated;
    },
    setWorkoutPlans(state, plans) {
      state.workoutPlans = Array.isArray(plans) ? plans : [];
    },
    addWorkoutPlan(state, plan) {
      if (!Array.isArray(state.workoutPlans)) {
        state.workoutPlans = [];
      }
      state.workoutPlans.push(plan);
    },
    updateWorkoutPlan(state, updatedPlan) {
      if (!Array.isArray(state.workoutPlans)) {
        state.workoutPlans = [];
        return;
      }
      const index = state.workoutPlans.findIndex(p => p.id === updatedPlan.id);
      if (index !== -1) {
        state.workoutPlans.splice(index, 1, updatedPlan);
      }
    },
    removeWorkoutPlan(state, planId) {
      if (!Array.isArray(state.workoutPlans)) {
        state.workoutPlans = [];
        return;
      }
      state.workoutPlans = state.workoutPlans.filter(p => p.id !== planId);
    },
    setWorkoutLogs(state, logs) {
      state.workoutLogs = Array.isArray(logs) ? logs : [];
    },
    addWorkoutLog(state, log) {
      if (!Array.isArray(state.workoutLogs)) {
        state.workoutLogs = [];
      }
      state.workoutLogs.push(log);
    },
    updateWorkoutLog(state, updatedLog) {
      if (!Array.isArray(state.workoutLogs)) {
        state.workoutLogs = [];
        return;
      }
      const index = state.workoutLogs.findIndex(l => l.id === updatedLog.id);
      if (index !== -1) {
        state.workoutLogs.splice(index, 1, updatedLog);
      }
    },
    removeWorkoutLog(state, logId) {
      if (!Array.isArray(state.workoutLogs)) {
        state.workoutLogs = [];
        return;
      }
      state.workoutLogs = state.workoutLogs.filter(l => l.id !== logId);
    },
    setGoals(state, goals) {
      state.goals = Array.isArray(goals) ? goals : [];
    },
    addGoal(state, goal) {
      if (!Array.isArray(state.goals)) {
        state.goals = [];
      }
      state.goals.push(goal);
    },
    updateGoal(state, updatedGoal) {
      if (!Array.isArray(state.goals)) {
        state.goals = [];
        return;
      }
      const index = state.goals.findIndex(g => g.id === updatedGoal.id);
      if (index !== -1) {
        state.goals.splice(index, 1, updatedGoal);
      }
    },
    removeGoal(state, goalId) {
      if (!Array.isArray(state.goals)) {
        state.goals = [];
        return;
      }
      state.goals = state.goals.filter(g => g.id !== goalId);
    },
    setStats(state, stats) {
      state.stats = stats;
    },
    showNotification(state, { message, type = 'info', timeout = 5000 }) {
      state.notification = {
        show: true,
        message,
        type,
        timeout
      };
    },
    hideNotification(state) {
      state.notification.show = false;
    }
  },
  actions: {
    async fetchUser({ commit }) {
      try {
        const user = await AuthService.getUser();
        commit('setUser', user);
        commit('setAuthenticated', !!user);
        return user;
      } catch (error) {
        console.error('Failed to fetch user:', error);
        commit('setAuthenticated', false);
        return null;
      }
    },
    async logout({ commit }) {
      // Clear user data
      commit('setUser', null);
      commit('setAuthenticated', false);
      
      // Clear workout data
      commit('setWorkoutPlans', []);
      commit('setWorkoutLogs', []);
      commit('setGoals', []);
      commit('setStats', null);
      
      // Use AuthService to logout
      AuthService.logout();
      
      // Show logout message
      this.dispatch('showMessage', {
        message: 'You have been logged out',
        type: 'info',
        timeout: 3000
      });
    },
    async fetchWorkoutPlans({ commit }) {
      try {
        const response = await ApiService.get('WorkoutPlans');
        console.log('Raw workout plans response:', response);
        
        let processedPlans = [];
        
        // Handle the reference-preserving JSON format from C# API
        if (response && typeof response === 'object') {
          if (Array.isArray(response)) {
            console.log('Response is a standard array');
            processedPlans = response;
          } else if (response.$values) {
            // Handle direct $values array at root
            console.log('Response has $values at root level');
            processedPlans = response.$values;
          } else if (response.$id && Array.isArray(response.$values)) {
            // Handle object with $id and $values properties
            console.log('Response has $id and $values properties');
            processedPlans = response.$values;
          }
        }
        
        console.log('Processed workout plans:', processedPlans);
        commit('setWorkoutPlans', processedPlans);
      } catch (error) {
        console.error('Failed to fetch workout plans:', error);
        throw error;
      }
    },
    async createWorkoutPlan({ commit }, planData) {
      try {
        const newPlan = await ApiService.post('WorkoutPlans', planData);
        commit('addWorkoutPlan', newPlan);
        return newPlan;
      } catch (error) {
        console.error('Failed to create workout plan:', error);
        throw error;
      }
    },
    async updateWorkoutPlan({ commit }, planData) {
      try {
        const updatedPlan = await ApiService.put(`WorkoutPlans/${planData.id}`, planData);
        commit('updateWorkoutPlan', updatedPlan);
        return updatedPlan;
      } catch (error) {
        console.error('Failed to update workout plan:', error);
        throw error;
      }
    },
    async deleteWorkoutPlan({ commit }, planId) {
      try {
        await ApiService.delete(`WorkoutPlans/${planId}`);
        commit('removeWorkoutPlan', planId);
      } catch (error) {
        console.error('Failed to delete workout plan:', error);
        throw error;
      }
    },
    async fetchWorkoutLogs({ commit }) {
      try {
        const response = await ApiService.get('WorkoutLogs');
        console.log('Raw workout logs response:', response);
        
        let processedLogs = [];
        
        // Handle the reference-preserving JSON format from C# API
        if (response && typeof response === 'object') {
          if (Array.isArray(response)) {
            console.log('Response is a standard array');
            processedLogs = response;
          } else if (response.$values) {
            // Handle direct $values array at root
            console.log('Response has $values at root level');
            processedLogs = response.$values;
          } else if (response.$id && Array.isArray(response.$values)) {
            // Handle object with $id and $values properties
            console.log('Response has $id and $values properties');
            processedLogs = response.$values;
          }
        }
        
        console.log('Processed workout logs:', processedLogs);
        commit('setWorkoutLogs', processedLogs);
      } catch (error) {
        console.error('Failed to fetch workout logs:', error);
        throw error;
      }
    },
    async createWorkoutLog({ commit }, logData) {
      try {
        console.log('Creating workout log with data:', JSON.stringify(logData));
        
        // Make sure workoutDate is properly formatted
        if (logData.workoutDate) {
          console.log(`Original workoutDate: ${logData.workoutDate}`);
        } else {
          console.warn('workoutDate is missing from logData!');
        }
        
        // Wrap the data in a 'workoutLog' object as required by the API
        const formattedData = { workoutLog: logData };
        console.log('Formatted data to send to API:', JSON.stringify(formattedData));
        
        const newLog = await ApiService.post('WorkoutLogs', formattedData);
        commit('addWorkoutLog', newLog);
        return newLog;
      } catch (error) {
        console.error('Failed to create workout log:', error);
        if (error.response) {
          console.error('Server response:', error.response.data);
        }
        throw error;
      }
    },
    async updateWorkoutLog({ commit }, logData) {
      try {
        console.log('Updating workout log with data:', JSON.stringify(logData));
        
        // Make sure workoutDate is properly formatted
        if (logData.workoutDate) {
          console.log(`Original workoutDate: ${logData.workoutDate}`);
        } else {
          console.warn('workoutDate is missing from logData!');
        }
        
        // Wrap the data in a 'workoutLog' object as required by the API
        const formattedData = { workoutLog: logData };
        console.log('Formatted data to send to API:', JSON.stringify(formattedData));
        
        const updatedLog = await ApiService.put(`WorkoutLogs/${logData.id}`, formattedData);
        commit('updateWorkoutLog', updatedLog);
        return updatedLog;
      } catch (error) {
        console.error('Failed to update workout log:', error);
        if (error.response) {
          console.error('Server response:', error.response.data);
        }
        throw error;
      }
    },
    async deleteWorkoutLog({ commit }, logId) {
      try {
        await ApiService.delete(`WorkoutLogs/${logId}`);
        commit('removeWorkoutLog', logId);
      } catch (error) {
        console.error('Failed to delete workout log:', error);
        throw error;
      }
    },
    async fetchGoals({ commit }) {
      try {
        const response = await ApiService.get('Goals');
        console.log('Goals response from API:', response);
        
        let processedGoals = [];
        
        if (Array.isArray(response)) {
          // Process each goal to ensure properties are in the expected case
          processedGoals = response.map(goal => {
            // Create a normalized goal object with lowercase property names
            return {
              id: goal.Id || goal.id,
              name: goal.Name || goal.name,
              description: goal.Description || goal.description,
              startDate: goal.StartDate || goal.startDate,
              targetDate: goal.TargetDate || goal.targetDate,
              startingValue: goal.StartingValue || goal.startingValue,
              currentValue: goal.CurrentValue || goal.currentValue,
              targetValue: goal.TargetValue || goal.targetValue,
              metricType: goal.MetricType || goal.metricType,
              unit: goal.Unit || goal.unit,
              isCompleted: goal.IsCompleted || goal.isCompleted,
              user: goal.User || goal.user
            };
          });
        } else if (response && typeof response === 'object') {
          console.warn('Response is not an array, but an object:', response);
          // Handle potential object with $values property (from System.Text.Json.ReferenceHandler.Preserve)
          if (Array.isArray(response.$values)) {
            processedGoals = response.$values.map(goal => ({
              id: goal.Id || goal.id,
              name: goal.Name || goal.name,
              description: goal.Description || goal.description,
              startDate: goal.StartDate || goal.startDate,
              targetDate: goal.TargetDate || goal.targetDate,
              startingValue: goal.StartingValue || goal.startingValue,
              currentValue: goal.CurrentValue || goal.currentValue,
              targetValue: goal.TargetValue || goal.targetValue,
              metricType: goal.MetricType || goal.metricType,
              unit: goal.Unit || goal.unit,
              isCompleted: goal.IsCompleted || goal.isCompleted,
              user: goal.User || goal.user
            }));
          }
          // Handle potential single object response
          else if (response.Id || response.id) {
            const goal = response;
            processedGoals = [{
              id: goal.Id || goal.id,
              name: goal.Name || goal.name,
              description: goal.Description || goal.description,
              startDate: goal.StartDate || goal.startDate,
              targetDate: goal.TargetDate || goal.targetDate,
              startingValue: goal.StartingValue || goal.startingValue,
              currentValue: goal.CurrentValue || goal.currentValue,
              targetValue: goal.TargetValue || goal.targetValue,
              metricType: goal.MetricType || goal.metricType,
              unit: goal.Unit || goal.unit,
              isCompleted: goal.IsCompleted || goal.isCompleted,
              user: goal.User || goal.user
            }];
          }
        }
        
        console.log('Processed goals to be stored in state:', processedGoals);
        commit('setGoals', processedGoals);
      } catch (error) {
        console.error('Failed to fetch goals:', error);
        throw error;
      }
    },
    async createGoal({ commit }, goalData) {
      try {
        // If the goalData already has properly capitalized fields (Id, Name, etc.), 
        // use it directly without transforming it
        if (goalData.Name) {
          console.log('Using pre-formatted goal data with capitalized field names:', goalData);
          
          // Send data directly without wrapping it in a 'goal' object - API now expects root level
          console.log('Sending data to API as root level object:', JSON.stringify(goalData, null, 2));
          
          const newGoal = await ApiService.post('Goals', goalData);
          console.log('Goal creation response:', newGoal);
          
          // Process the response to ensure consistent property casing
          const processedGoal = {
            id: newGoal.Id || newGoal.id,
            name: newGoal.Name || newGoal.name,
            description: newGoal.Description || newGoal.description,
            startDate: newGoal.StartDate || newGoal.startDate,
            targetDate: newGoal.TargetDate || newGoal.targetDate,
            startingValue: newGoal.StartingValue || newGoal.startingValue,
            currentValue: newGoal.CurrentValue || newGoal.currentValue,
            targetValue: newGoal.TargetValue || newGoal.targetValue,
            metricType: newGoal.MetricType || newGoal.metricType,
            unit: newGoal.Unit || newGoal.unit,
            isCompleted: newGoal.IsCompleted || newGoal.isCompleted,
            user: newGoal.User || newGoal.user
          };
          
          commit('addGoal', processedGoal);
          return processedGoal;
        } 
        // Otherwise, use the original implementation for backward compatibility
        else {
          // Log the original goal data for debugging
          console.log('Original goal data:', JSON.stringify(goalData, null, 2));
          
          // Ensure all required fields are present
          if (!goalData.name) {
            throw new Error('Goal name is required');
          }
          
          if (!goalData.targetValue) {
            throw new Error('Goal target value is required');
          }
          
          if (!goalData.startDate || !goalData.targetDate) {
            throw new Error('Goal start and target dates are required');
          }
          
          // Format dates correctly if they're not already ISO strings
          if (goalData.startDate && !(typeof goalData.startDate === 'string' && goalData.startDate.includes('T'))) {
            goalData.startDate = new Date(goalData.startDate).toISOString();
          }
          
          if (goalData.targetDate && !(typeof goalData.targetDate === 'string' && goalData.targetDate.includes('T'))) {
            goalData.targetDate = new Date(goalData.targetDate).toISOString();
          }
          
          // Create properly formatted goal data with correct casing and all required fields
          const formattedGoalData = {
            Id: goalData.id !== undefined && goalData.id !== null ? parseInt(goalData.id, 10) || null : null,
            Name: goalData.name,
            Description: goalData.description || "Goal created from workout tracker",
            StartDate: goalData.startDate,
            TargetDate: goalData.targetDate,
            StartingValue: goalData.startingValue,
            CurrentValue: goalData.currentValue,
            TargetValue: goalData.targetValue,
            MetricType: goalData.metricType,
            Unit: goalData.unit,
            IsCompleted: goalData.isCompleted || false,
            User: {
              Auth0Id: localStorage.getItem('user_profile') ? JSON.parse(localStorage.getItem('user_profile')).sub : null
            }
          };
          
          // Send the data without wrapping - API now expects root level properties
          console.log('Sending formatted goal data to API:', JSON.stringify(formattedGoalData, null, 2));
          
          const newGoal = await ApiService.post('Goals', formattedGoalData);
          console.log('Goal creation response:', newGoal);
          
          // Process the response to ensure consistent property casing
          const processedGoal = {
            id: newGoal.Id || newGoal.id,
            name: newGoal.Name || newGoal.name,
            description: newGoal.Description || newGoal.description,
            startDate: newGoal.StartDate || newGoal.startDate,
            targetDate: newGoal.TargetDate || newGoal.targetDate,
            startingValue: newGoal.StartingValue || newGoal.startingValue,
            currentValue: newGoal.CurrentValue || newGoal.currentValue,
            targetValue: newGoal.TargetValue || newGoal.targetValue,
            metricType: newGoal.MetricType || newGoal.metricType,
            unit: newGoal.Unit || newGoal.unit,
            isCompleted: newGoal.IsCompleted || newGoal.isCompleted,
            user: newGoal.User || newGoal.user
          };
          
          commit('addGoal', processedGoal);
          return processedGoal;
        }
      } catch (error) {
        console.error('Failed to create goal:', error);
        throw error;
      }
    },
    async updateGoal({ commit }, goalData) {
      try {
        // If the goalData already has properly capitalized fields (Id, Name, etc.), 
        // use it directly without transforming it
        if (goalData.Name) {
          console.log('Using pre-formatted goal data with capitalized field names:', goalData);
          
          // Send data directly without wrapping - API now expects root level properties
          console.log('Sending data to API as root level object:', JSON.stringify(goalData, null, 2));
          
          const updatedGoal = await ApiService.put(`Goals/${goalData.Id}`, goalData);
          
          // Process the response to ensure consistent property casing
          const processedGoal = {
            id: updatedGoal.Id || updatedGoal.id,
            name: updatedGoal.Name || updatedGoal.name,
            description: updatedGoal.Description || updatedGoal.description,
            startDate: updatedGoal.StartDate || updatedGoal.startDate,
            targetDate: updatedGoal.TargetDate || updatedGoal.targetDate,
            startingValue: updatedGoal.StartingValue || updatedGoal.startingValue,
            currentValue: updatedGoal.CurrentValue || updatedGoal.currentValue,
            targetValue: updatedGoal.TargetValue || updatedGoal.targetValue,
            metricType: updatedGoal.MetricType || updatedGoal.metricType,
            unit: updatedGoal.Unit || updatedGoal.unit,
            isCompleted: updatedGoal.IsCompleted || updatedGoal.isCompleted,
            user: updatedGoal.User || updatedGoal.user
          };
          
          commit('updateGoal', processedGoal);
          return processedGoal;
        }
        // Otherwise, use the original implementation for backward compatibility
        else {
          console.log('Original goal data for update:', JSON.stringify(goalData, null, 2));
          
          // Create properly formatted goal data with correct casing and all required fields
          const formattedGoalData = {
            Id: parseInt(goalData.id, 10),
            Name: goalData.name,
            Description: goalData.description || "Goal updated from workout tracker",
            StartDate: typeof goalData.startDate === 'string' && goalData.startDate.includes('T') ? 
              goalData.startDate : new Date(goalData.startDate).toISOString(),
            TargetDate: typeof goalData.targetDate === 'string' && goalData.targetDate.includes('T') ? 
              goalData.targetDate : new Date(goalData.targetDate).toISOString(),
            StartingValue: goalData.startingValue,
            CurrentValue: goalData.currentValue,
            TargetValue: goalData.targetValue,
            MetricType: goalData.metricType,
            Unit: goalData.unit,
            IsCompleted: goalData.isCompleted || false,
            User: {
              Auth0Id: localStorage.getItem('user_profile') ? JSON.parse(localStorage.getItem('user_profile')).sub : null
            }
          };
          
          // Send data directly without wrapping - API now expects root level properties
          console.log('Sending formatted goal update data to API:', JSON.stringify(formattedGoalData, null, 2));
          
          const updatedGoal = await ApiService.put(`Goals/${formattedGoalData.Id}`, formattedGoalData);
          
          // Process the response to ensure consistent property casing
          const processedGoal = {
            id: updatedGoal.Id || updatedGoal.id,
            name: updatedGoal.Name || updatedGoal.name,
            description: updatedGoal.Description || updatedGoal.description,
            startDate: updatedGoal.StartDate || updatedGoal.startDate,
            targetDate: updatedGoal.TargetDate || updatedGoal.targetDate,
            startingValue: updatedGoal.StartingValue || updatedGoal.startingValue,
            currentValue: updatedGoal.CurrentValue || updatedGoal.currentValue,
            targetValue: updatedGoal.TargetValue || updatedGoal.targetValue,
            metricType: updatedGoal.MetricType || updatedGoal.metricType,
            unit: updatedGoal.Unit || updatedGoal.unit,
            isCompleted: updatedGoal.IsCompleted || updatedGoal.isCompleted,
            user: updatedGoal.User || updatedGoal.user
          };
          
          commit('updateGoal', processedGoal);
          return processedGoal;
        }
      } catch (error) {
        console.error('Failed to update goal:', error);
        throw error;
      }
    },
    async updateGoalProgress({ dispatch }, progressData) {
      try {
        const goalId = progressData.goalId;
        
        // Format the progress data
        const formattedData = {
          Value: progressData.value,
          Date: typeof progressData.date === 'string' && progressData.date.includes('T') ?
            progressData.date : new Date(progressData.date).toISOString(),
          Notes: progressData.notes || ""
        };
        
        console.log(`Updating progress for goal ${goalId}:`, JSON.stringify(formattedData, null, 2));
        
        // Log the API URL for debugging
        const apiUrl = '/api';
        const url = `${apiUrl}/Goals/${goalId}/progress`;
        console.log('Progress update API URL:', url);
        
        // Make the API call
        const response = await ApiService.post(`Goals/${goalId}/progress`, formattedData);
        console.log('Goal progress update successful:', response);
        
        // Refresh goals to get the updated data
        await dispatch('fetchGoals');
        return response;
      } catch (error) {
        console.error(`Failed to update goal progress for goal ID ${progressData.goalId}:`, error);
        
        // Enhanced error reporting
        if (error.response) {
          console.error('Response data:', error.response.data);
          console.error('Response status:', error.response.status);
          console.error('Response headers:', error.response.headers);
        } else if (error.request) {
          console.error('Request made but no response received. Network issue?', error.request);
        } else {
          console.error('Error setting up request:', error.message);
        }
        
        throw error;
      }
    },
    async deleteGoal({ commit }, goalId) {
      try {
        await ApiService.delete(`Goals/${goalId}`);
        commit('removeGoal', goalId);
      } catch (error) {
        console.error('Failed to delete goal:', error);
        throw error;
      }
    },
    async fetchStats({ commit }) {
      try {
        const stats = await ApiService.get('Stats/summary');
        commit('setStats', stats);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        throw error;
      }
    },
    async fetchChartData({ commit }, chartType) {
      try {
        const data = await ApiService.get(`Stats/${chartType}`);
        return data;
      } catch (error) {
        console.error(`Failed to fetch chart data (${chartType}):`, error);
        throw error;
      }
    },
    showMessage({ commit }, { message, type, timeout }) {
      commit('showNotification', { message, type, timeout });
      
      // Automatically hide the notification after the timeout
      setTimeout(() => {
        commit('hideNotification');
      }, timeout);
    },
    async refreshAllData() {
      console.log('Refreshing all data from API');
      return Promise.all([
        this.dispatch('fetchWorkoutPlans'),
        this.dispatch('fetchWorkoutLogs'),
        this.dispatch('fetchGoals'),
        this.dispatch('fetchStats')
      ]).catch(error => {
        console.error('Error refreshing all data:', error);
        return Promise.reject(error);
      });
    }
  }
});

// Subscribe to store changes to save state
store.subscribe((mutation, state) => {
  console.log('Store mutation detected:', mutation.type);
  
  // Only save state for certain mutations
  if (mutation.type.startsWith('set') || 
      mutation.type.startsWith('add') || 
      mutation.type.startsWith('update') || 
      mutation.type.startsWith('remove')) {
    
    // Use setTimeout to ensure the state is fully updated before saving
    setTimeout(() => {
      saveState(state);
    }, 0);
  }
});

// Add a new action to refresh all data
store.dispatch = (function(originalDispatch) {
  return function(type, payload) {
    if (type === 'refreshAllData') {
      console.log('Refreshing all data from API');
      return Promise.all([
        originalDispatch('fetchWorkoutPlans'),
        originalDispatch('fetchWorkoutLogs'),
        originalDispatch('fetchGoals'),
        originalDispatch('fetchStats')
      ]).catch(error => {
        console.error('Error refreshing all data:', error);
        return Promise.reject(error);
      });
    }
    return originalDispatch(type, payload);
  };
})(store.dispatch);

// Initialize the NotificationService with the store
NotificationService.init(store);

const app = createApp(App);
app.use(router);
app.use(store);

// After the app is mounted, initialize data if we're authenticated
app.mount('#app');

// Check if user is authenticated, then load data
if (AuthService.isAuthenticated()) {
  console.log('User is authenticated, loading initial data');
  store.dispatch('refreshAllData').catch(error => {
    console.error('Failed to load initial data:', error);
  });
} 