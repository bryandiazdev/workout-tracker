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
        
        // Prepare goal data to EXACTLY match the working MongoDB document structure
        // This needs to match the format in the working record (67dade72f1069d0f4496b384)
        const mongoFormatGoal = {
          // These fields MUST be capitalized exactly as in MongoDB
          Name: goalData.Name || goalData.name || '',
          Description: goalData.Description || goalData.description || 'Goal created from workout tracker',
          Unit: goalData.Unit || goalData.unit || 'kg',
          User: {
            Auth0Id: userId || (goalData.User?.Auth0Id || goalData.user?.auth0Id || 'unknown')
          },
          StartDate: goalData.StartDate || goalData.startDate || new Date().toISOString(),
          TargetDate: goalData.TargetDate || goalData.targetDate || new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
          StartingValue: parseFloat(goalData.StartingValue || goalData.startingValue) || 0,
          CurrentValue: parseFloat(goalData.CurrentValue || goalData.currentValue) || 0,
          TargetValue: parseFloat(goalData.TargetValue || goalData.targetValue) || 0,
          MetricType: goalData.MetricType || goalData.metricType || 'weight',
          IsCompleted: false,
          // These additional fields match what we see in the MongoDB document
          userId: userId, // This appears to be a flattened field in MongoDB
          isCompleted: false, // Note: both cases exist in the document!
          progresses: []
        };
        
        // Remove any undefined values
        Object.keys(mongoFormatGoal).forEach(key => 
          mongoFormatGoal[key] === undefined && delete mongoFormatGoal[key]
        );
        
        console.log('Exact MongoDB document format for goal:', JSON.stringify(mongoFormatGoal, null, 2));
        
        // Make API call to create the goal
        const response = await ApiService.post('Goals', mongoFormatGoal);
        console.log('Create goal API response:', response);
        
        // Check if we got a proper response
        if (!response) {
          throw new Error('No response from server');
        }
        
        // Get the ID from the response
        const newGoalId = response.id || response._id || response.Id;
        
        if (!newGoalId) {
          console.error('Failed to get goal ID from API response');
          throw new Error('Goal ID not found in API response');
        }
        
        console.log('New goal created with ID:', newGoalId);
        
        // If the API returned just an ID with missing values, update it immediately
        let createdGoal;
        
        if (!response.Name) {
          console.log('API returned response with missing required properties - performing immediate update');
          
          // Add the ID to our MongoDB format goal
          const updateGoal = {
            ...mongoFormatGoal,
            Id: newGoalId  // Include ID for the update operation
          };
          
          console.log('Performing immediate update with complete data:', JSON.stringify(updateGoal, null, 2));
          
          try {
            // Immediately update the goal with complete data
            const updateResponse = await ApiService.put(`Goals/${newGoalId}`, updateGoal);
            console.log('Immediate update response:', updateResponse);
            
            if (updateResponse) {
              createdGoal = normalizeGoalProperties(updateResponse);
            } else {
              // If update response is missing, use our original data with the ID
              createdGoal = {
                ...normalizeGoalProperties(mongoFormatGoal),
                id: newGoalId,
                _id: newGoalId,
                createdDate: new Date().toISOString()
              };
            }
          } catch (updateError) {
            console.error('Error during immediate update:', updateError);
            
            // Fall back to our prepared data with the ID
            createdGoal = {
              ...normalizeGoalProperties(mongoFormatGoal),
              id: newGoalId,
              _id: newGoalId,
              createdDate: new Date().toISOString()
            };
          }
        } else {
          // API returned complete goal data
          createdGoal = normalizeGoalProperties(response);
          console.log('Goal created successfully with all properties:', createdGoal);
        }
        
        // Add the goal to the store
        commit('addGoal', createdGoal);
        
        // Refresh goals from API for consistency
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