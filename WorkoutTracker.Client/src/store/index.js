import { createStore } from 'vuex';
import ApiService from '../services/ApiService';

const storeConfig = {
  state: {
    goals: []
  },
  actions: {
    async fetchGoals({ commit }) {
      try {
        console.log('Fetching goals from API...');
        const response = await ApiService.get('Goals');
        console.log('Goals API response:', response);
        
        // Process goals to normalize property names
        let normalizedGoals = [];
        
        if (Array.isArray(response)) {
          normalizedGoals = response.map(goal => normalizeGoalProperties(goal));
        } else if (response && typeof response === 'object') {
          // Handle potential different response formats
          if (response.value && Array.isArray(response.value)) {
            // Handle OData format
            normalizedGoals = response.value.map(goal => normalizeGoalProperties(goal));
          } else if (response.Id || response.id) {
            // Single goal object response
            normalizedGoals = [normalizeGoalProperties(response)];
          }
        }
        
        console.log('Normalized goals for store:', normalizedGoals);
        commit('setGoals', normalizedGoals);
        return normalizedGoals;
      } catch (error) {
        console.error('Error fetching goals:', error);
        throw error;
      }
    },
    
    async createGoal({ commit, dispatch }, goalData) {
      try {
        console.log('Creating goal with data:', goalData);
        
        // Get the user ID from localStorage
        let userId = null;
        try {
          const userProfile = localStorage.getItem('user_profile');
          if (userProfile) {
            const profile = JSON.parse(userProfile);
            userId = profile.sub || profile.email;
            console.log('User ID from profile:', userId);
          }
        } catch (error) {
          console.error('Error getting user ID:', error);
        }
        
        // Ensure goal data has properly capitalized field names for API
        const formattedGoal = {
          ...ensureProperCasingForApi(goalData),
          // Make sure User is properly formatted
          User: {
            Auth0Id: userId || (goalData.User?.Auth0Id || goalData.user?.auth0Id || 'unknown')
          }
        };
        
        console.log('Formatted goal data for API with user:', formattedGoal);
        
        // Make API call
        const response = await ApiService.post('Goals', formattedGoal);
        console.log('Create goal API response:', response);
        
        // Check if we got a proper response
        if (!response) {
          throw new Error('No response from server');
        }
        
        // If the API returned a goal without proper properties, we need to merge with our input data
        let createdGoal;
        
        // If the response has an ID but is missing goal data
        if (response.id || response._id || response.Id) {
          console.log('Response contains an ID:', response.id || response._id || response.Id);
          
          // Check if the response is missing critical goal properties
          if (!response.Name && !response.name && !response.Description && !response.description) {
            console.log('API response missing goal properties - merging with input data');
            
            // Create a complete goal by combining the response ID with our input data
            createdGoal = {
              // Start with our normalized input data
              ...normalizeGoalProperties(formattedGoal),
              
              // Override with the ID from the response
              id: response.id || response._id || response.Id,
              _id: response.id || response._id || response.Id,
              
              // Include any other fields from the response
              createdDate: response.createdDate || new Date().toISOString(),
              userId: response.userId || userId
            };
            
            console.log('Created merged goal with input data:', createdGoal);
            
            // Add this goal directly to the state
            commit('addGoal', createdGoal);
          } else {
            // Response has both ID and some goal properties
            createdGoal = normalizeGoalProperties(response);
            console.log('Normalized goal from response:', createdGoal);
            
            // Add this goal directly to the state
            commit('addGoal', createdGoal);
          }
        } else {
          // Unexpected response format
          console.warn('Unexpected API response format:', response);
          createdGoal = normalizeGoalProperties(formattedGoal);
          createdGoal.id = Math.random().toString(36).substr(2, 9); // Generate a temporary ID
          
          // Add this goal directly to the state
          commit('addGoal', createdGoal);
        }
        
        // We've already added the goal to the state, but still refresh from API to ensure consistency
        dispatch('fetchGoals');
        
        return createdGoal;
      } catch (error) {
        console.error('Error creating goal:', error);
        throw error;
      }
    },
    
    async updateGoal({ commit, dispatch }, goalData) {
      try {
        console.log('Updating goal with data:', goalData);
        
        // Ensure goal data has properly capitalized field names for API
        const formattedGoal = ensureProperCasingForApi(goalData);
        
        // Make sure we have a valid ID
        if (!formattedGoal.Id) {
          throw new Error('Goal ID is required for update');
        }
        
        console.log('Formatted goal data for update:', formattedGoal);
        
        // Send the update request with the properly capitalized ID
        const response = await ApiService.put(`Goals/${formattedGoal.Id}`, formattedGoal);
        console.log('Update goal response:', response);
        
        // Refresh goals list
        await dispatch('fetchGoals');
        return response;
      } catch (error) {
        console.error('Error updating goal:', error);
        throw error;
      }
    },
    
    async deleteGoal({ commit, dispatch }, goalId) {
      try {
        console.log('Deleting goal with ID:', goalId);
        
        // Make sure we have a valid ID
        if (!goalId) {
          throw new Error('Goal ID is required for deletion');
        }
        
        // Make the API call to delete the goal
        await ApiService.delete(`Goals/${goalId}`);
        
        // Update the store
        commit('removeGoal', goalId);
        
        console.log('Goal deleted successfully');
        return true;
      } catch (error) {
        console.error('Error deleting goal:', error);
        throw error;
      }
    }
  },
  mutations: {
    setGoals(state, goals) {
      state.goals = goals;
    },
    
    // Add the removeGoal mutation
    removeGoal(state, goalId) {
      state.goals = state.goals.filter(goal => {
        // Handle different ID formats (uppercase Id, lowercase id, MongoDB _id)
        const id = goal.Id || goal.id || goal._id;
        return id !== goalId;
      });
    },
    
    addGoal(state, goal) {
      state.goals.push(goal);
    }
  }
};

// Helper function to normalize goal properties to lowercase for consistency in the UI
function normalizeGoalProperties(goal) {
  if (!goal) return {};
  
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
    // Preserve original data for debugging
    _original: { ...goal }
  };
}

// Helper function to ensure goal data has proper casing for API
function ensureProperCasingForApi(goal) {
  return {
    Id: goal.Id || goal.id,
    Name: goal.Name || goal.name,
    Description: goal.Description || goal.description,
    StartDate: goal.StartDate || goal.startDate,
    TargetDate: goal.TargetDate || goal.targetDate, 
    StartingValue: goal.StartingValue || goal.startingValue,
    CurrentValue: goal.CurrentValue || goal.currentValue,
    TargetValue: goal.TargetValue || goal.targetValue,
    MetricType: goal.MetricType || goal.metricType,
    Unit: goal.Unit || goal.unit,
    IsCompleted: goal.IsCompleted || goal.isCompleted,
    User: goal.User || goal.user
  };
}

export default createStore(storeConfig); 