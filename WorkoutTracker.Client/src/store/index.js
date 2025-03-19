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
        // Ensure goal data has properly capitalized field names for API
        const formattedGoal = ensureProperCasingForApi(goalData);
        
        const response = await ApiService.post('Goals', formattedGoal);
        console.log('Create goal response:', response);
        
        // Refresh goals list
        await dispatch('fetchGoals');
        return response;
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
        
        const response = await ApiService.put(`Goals/${formattedGoal.Id || formattedGoal.id}`, formattedGoal);
        console.log('Update goal response:', response);
        
        // Refresh goals list
        await dispatch('fetchGoals');
        return response;
      } catch (error) {
        console.error('Error updating goal:', error);
        throw error;
      }
    }
  },
  mutations: {
    setGoals(state, goals) {
      state.goals = goals;
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