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
        let createdGoal = response;
        
        // If response doesn't contain essential properties but has an ID, merge with input
        if (response.id || response._id) {
          if (!response.Name && !response.name) {
            console.log('API returned a goal without properties, merging with input data');
            
            createdGoal = {
              ...normalizeGoalProperties(formattedGoal), // Use our input data
              id: response.id || response._id, // But use the returned ID
              _id: response.id || response._id,
              createdDate: response.createdDate
            };
            
            console.log('Merged goal data:', createdGoal);
          } else {
            // Try to normalize the response
            createdGoal = normalizeGoalProperties(response);
          }
        }
        
        console.log('Normalized created goal:', createdGoal);
        
        // Refresh goals list
        await dispatch('fetchGoals');
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