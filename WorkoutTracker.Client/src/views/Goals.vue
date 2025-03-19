<template>
  <div class="goals">
    <h1>Fitness Goals</h1>
    
    <!-- Authentication Status Message -->
    <div v-if="authError" class="auth-error-container">
      <div class="auth-error card">
        <div class="card-body text-center">
          <i class="fas fa-lock fa-3x mb-3"></i>
          <h3>Authentication Required</h3>
          <p>{{ authErrorMessage }}</p>
          <button class="btn btn-primary mt-3" @click="redirectToLogin">
            Log In
          </button>
        </div>
      </div>
    </div>
    
    <div v-else class="goals-container">
      <div class="section-header">
        <h2>Your Goals</h2>
        <button class="btn btn-primary" @click="showGoalForm = true">
          <i class="fas fa-plus"></i> Set New Goal
        </button>
      </div>
      
      <div v-if="loading" class="loading-indicator">
        <p>Loading your goals...</p>
      </div>
      
      <div v-else-if="goals.length === 0" class="empty-state">
        <div class="card">
          <div class="card-body text-center">
            <i class="fas fa-bullseye fa-3x mb-3"></i>
            <h3>No Goals Set Yet</h3>
            <p>Setting clear goals is key to staying motivated and tracking your progress.</p>
            <button class="btn btn-primary mt-3" @click="showGoalForm = true">
              Set Your First Goal
            </button>
          </div>
        </div>
      </div>
      
      <div v-else class="goals-list">
        <div v-for="goal in goals" :key="goal.id || goal._id" class="goal-card">
          <div class="goal-status">
            <span v-if="goal.IsCompleted || goal.isCompleted" class="status-badge completed">Completed</span>
            <span v-else class="status-badge in-progress">In Progress</span>
          </div>

          <div class="goal-details">
            <h3>{{ goal.Name || goal.name }}</h3>
            <p class="goal-description">{{ goal.Description || goal.description }}</p>
            
            <div class="goal-metrics">
              <div class="goal-metric">
                <span class="metric-label">Target:</span>
                <span class="metric-value">{{ goal.TargetValue || goal.targetValue }} {{ goal.Unit || goal.unit }}</span>
              </div>
              
              <div class="goal-metric">
                <span class="metric-label">Current:</span>
                <span class="metric-value">{{ goal.CurrentValue || goal.currentValue || 0 }} {{ goal.Unit || goal.unit }}</span>
              </div>
            </div>
            
            <div class="goal-dates">
              <div class="goal-date">
                <span class="date-label">Start:</span>
                <span class="date-value">{{ formatDate(goal.StartDate || goal.startDate) }}</span>
              </div>
              
              <div class="goal-date">
                <span class="date-label">Target:</span>
                <span class="date-value">{{ formatDate(goal.TargetDate || goal.targetDate) }}</span>
              </div>
            </div>
            
            <div class="goal-progress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: getProgressPercentage(goal) + '%' }"></div>
              </div>
              <div class="progress-labels">
                <span class="progress-start">{{ goal.StartingValue || goal.startingValue || 0 }}</span>
                <span class="progress-percentage">{{ Math.round(getProgressPercentage(goal)) }}%</span>
                <span class="progress-target">{{ goal.TargetValue || goal.targetValue }}</span>
              </div>
            </div>
          </div>
          
          <div class="goal-actions">
            <button class="btn btn-primary" @click="editGoal(goal)">Edit</button>
            <button class="btn btn-danger" @click="confirmDeleteGoal(goal.Id || goal._id || goal.id)">Delete</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Goal Creation/Edit Form -->
    <div v-if="showGoalForm" class="goal-form-overlay">
      <div class="goal-form-container card">
        <div class="card-header">
          <h3>{{ isEditing ? 'Edit Goal' : 'Set New Goal' }}</h3>
          <button class="btn-icon" @click="closeForm">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="card-body">
          <form @submit.prevent="saveGoal">
            <div class="form-group">
              <label for="goal-name">Goal Name</label>
              <input 
                type="text" 
                id="goal-name" 
                class="form-control" 
                v-model="goalForm.name" 
                required
              >
            </div>
            
            <div class="form-group">
              <label for="goal-description">Description</label>
              <textarea 
                id="goal-description" 
                class="form-control" 
                v-model="goalForm.description" 
                rows="3"
              ></textarea>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="goal-start-date">Start Date</label>
                <input 
                  type="date" 
                  id="goal-start-date" 
                  class="form-control" 
                  v-model="goalForm.startDate" 
                  required
                >
              </div>
              
              <div class="form-group">
                <label for="goal-target-date">Target Date</label>
                <input 
                  type="date" 
                  id="goal-target-date" 
                  class="form-control" 
                  v-model="goalForm.targetDate" 
                  required
                >
              </div>
            </div>
            
            <div class="form-group">
              <label for="goal-metric-type">Metric Type</label>
              <select 
                id="goal-metric-type" 
                class="form-control" 
                v-model="goalForm.metricType" 
                @change="updateUnitBasedOnMetricType"
                required
              >
                <option value="weight">Body Weight</option>
                <option value="workout_frequency">Workout Frequency</option>
                <option value="strength">Strength</option>
                <option value="distance">Distance</option>
                <option value="calories">Calories Burned</option>
              </select>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="goal-starting-value">Starting Value</label>
                <input 
                  type="number" 
                  id="goal-starting-value" 
                  class="form-control" 
                  v-model.number="goalForm.startingValue" 
                  min="0" 
                  step="0.1" 
                  required
                >
              </div>
              
              <div class="form-group">
                <label for="goal-current-value">Current Value</label>
                <input 
                  type="number" 
                  id="goal-current-value" 
                  class="form-control" 
                  v-model.number="goalForm.currentValue" 
                  min="0" 
                  step="0.1" 
                  required
                >
              </div>
              
              <div class="form-group">
                <label for="goal-target-value">Target Value</label>
                <input 
                  type="number" 
                  id="goal-target-value" 
                  class="form-control" 
                  v-model.number="goalForm.targetValue" 
                  min="0" 
                  step="0.1" 
                  required
                >
              </div>
            </div>
            
            <div class="form-group">
              <label for="goal-unit">Unit</label>
              <select 
                id="goal-unit" 
                class="form-control" 
                v-model="goalForm.unit"
              >
                <option value="kg">Kilograms (kg)</option>
                <option value="lbs">Pounds (lbs)</option>
                <option value="workouts">Workouts</option>
                <option value="times">Times</option>
                <option value="km">Kilometers (km)</option>
                <option value="mi">Miles (mi)</option>
                <option value="kcal">Calories (kcal)</option>
              </select>
            </div>
            
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" @click="closeForm">
                Cancel
              </button>
              <button type="button" class="btn btn-success" @click="finalDebugApproach">
                Create Goal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    
    <!-- Progress Update Form -->
    <div v-if="showProgressForm" class="goal-form-overlay">
      <div class="goal-form-container card">
        <div class="card-header">
          <h3>Update Goal Progress</h3>
          <button class="btn-icon" @click="closeProgressForm">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="card-body">
          <form @submit.prevent="updateProgress">
            <div class="form-group">
              <label :for="`goal-current-value-update`">
                Current {{ getMetricLabel(progressForm.metricType) }}
              </label>
              <input 
                :id="`goal-current-value-update`" 
                type="number" 
                class="form-control" 
                v-model.number="progressForm.currentValue" 
                min="0" 
                step="0.1" 
                required
              >
              <small class="form-text text-muted">
                Previous value: {{ progressForm.previousValue }} {{ getMetricUnit(progressForm.metricType) }}
              </small>
            </div>
            
            <div class="form-group">
              <label for="progress-date">Date</label>
              <input 
                type="date" 
                id="progress-date" 
                class="form-control" 
                v-model="progressForm.date" 
                required
              >
            </div>
            
            <div class="form-group">
              <label for="progress-notes">Notes (optional)</label>
              <textarea 
                id="progress-notes" 
                class="form-control" 
                v-model="progressForm.notes" 
                rows="3"
              ></textarea>
            </div>
            
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" @click="closeProgressForm">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary">
                Update Progress
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    
    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="confirmation-modal">
      <div class="confirmation-content card">
        <div class="card-header">
          <h3>Delete Goal</h3>
        </div>
        <div class="card-body">
          <p>Are you sure you want to delete this goal? This action cannot be undone.</p>
          <div class="confirmation-actions">
            <button class="btn btn-secondary" @click="showDeleteConfirm = false">
              Cancel
            </button>
            <button class="btn btn-danger" @click="deleteGoal">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import NotificationService from '../services/NotificationService';
import ApiService from '../services/ApiService';

export default {
  name: 'Goals',
  data() {
    return {
      loading: true,
      showGoalForm: false,
      showProgressForm: false,
      isEditing: false,
      showDeleteConfirm: false,
      goalToDeleteId: null,
      goalForm: this.getEmptyGoalForm(),
      progressForm: {
        goalId: null,
        previousValue: 0,
        currentValue: 0,
        metricType: '',
        date: new Date().toISOString().substr(0, 10),
        notes: ''
      },
      authError: false,
      authErrorMessage: 'You need to be logged in to view and manage your goals.'
    };
  },
  computed: {
    ...mapState(['goals'])
  },
  methods: {
    ...mapActions(['fetchGoals', 'createGoal', 'updateGoal', 'updateGoalProgress', 'deleteGoal']),
    
    getEmptyGoalForm() {
      return {
        id: null,
        name: '',
        description: '',
        metricType: 'weight',
        unit: 'kg',
        startingValue: 0,
        currentValue: 0,
        targetValue: 0,
        startDate: new Date().toISOString().substr(0, 10),
        targetDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().substr(0, 10),
        isCompleted: false
      };
    },
    
    async loadData() {
      this.loading = true;
      try {
        // Check for authentication token first
        const token = localStorage.getItem('auth_token');
        if (!token) {
          console.error('No authentication token found');
          this.authError = true;
          this.authErrorMessage = 'You need to log in to view your goals.';
          this.loading = false;
          return;
        }
        
        // Dispatch the Vuex action to fetch goals
        console.log('Dispatching fetchGoals action from store');
        await this.$store.dispatch('fetchGoals');
        
        // Log the goals received from store
        console.log('Goals loaded from store:', this.goals);
      } catch (error) {
        console.error('Error loading goals:', error);
        
        // Check if this is an authentication error
        if (error.status === 401 || error.message?.includes('Unauthorized') || error.message?.includes('401')) {
          this.authError = true;
          this.authErrorMessage = 'Your session has expired. Please log in again.';
          localStorage.removeItem('auth_token'); // Clear the invalid token
          NotificationService.showError('Authentication required');
        } else {
          NotificationService.showError('Failed to load goals data');
        }
      } finally {
        this.loading = false;
      }
    },
    
    editGoal(goal) {
      console.log('Editing goal:', goal);
      this.isEditing = true;
      
      this.goalForm = {
        id: goal.Id || goal._id || goal.id,
        name: goal.Name || goal.name || '',
        description: goal.Description || goal.description || '',
        metricType: goal.MetricType || goal.metricType || 'weight',
        unit: goal.Unit || goal.unit || 'kg',
        startingValue: goal.StartingValue || goal.startingValue || 0,
        currentValue: goal.CurrentValue || goal.currentValue || 0,
        targetValue: goal.TargetValue || goal.targetValue || 0,
        startDate: this.formatDateForInput(goal.StartDate || goal.startDate),
        targetDate: this.formatDateForInput(goal.TargetDate || goal.targetDate),
        isCompleted: goal.IsCompleted || goal.isCompleted || false
      };
      
      console.log('Goal form data:', this.goalForm);
      this.showGoalForm = true;
    },
    
    showUpdateForm(goal) {
      this.progressForm = {
        goalId: goal.id,
        previousValue: goal.currentValue,
        currentValue: goal.currentValue,
        metricType: goal.metricType,
        date: new Date().toISOString().substr(0, 10),
        notes: ''
      };
      
      this.showProgressForm = true;
    },
    
    closeForm() {
      this.showGoalForm = false;
      this.isEditing = false;
      this.goalForm = this.getEmptyGoalForm();
    },
    
    closeProgressForm() {
      this.showProgressForm = false;
    },
    
    async saveGoal() {
      try {
        this.isSaving = true;
        
        // Format dates properly
        const startDate = this.formatDateForAPI(this.goalForm.startDate);
        const targetDate = this.formatDateForAPI(this.goalForm.targetDate);
        
        // Create goal data object with proper uppercase property names
        const goalData = {
          Id: this.goalForm.id,
          Name: this.goalForm.name,
          Description: this.goalForm.description,
          MetricType: this.goalForm.metricType,
          Unit: this.goalForm.unit,
          StartingValue: parseFloat(this.goalForm.startingValue),
          CurrentValue: parseFloat(this.goalForm.currentValue),
          TargetValue: parseFloat(this.goalForm.targetValue),
          StartDate: startDate,
          TargetDate: targetDate,
          IsCompleted: this.goalForm.isCompleted
        };
        
        console.log('Saving goal with data:', goalData);
        
        if (this.isEditing && this.goalForm.id) {
          // Update existing goal
          console.log(`Updating goal with ID: ${this.goalForm.id}`);
          await this.$store.dispatch('updateGoal', goalData);
          this.$store.dispatch('showMessage', {
            message: 'Goal updated successfully!',
            type: 'success'
          });
        } else {
          // Create new goal
          console.log('Creating new goal');
          await this.$store.dispatch('createGoal', goalData);
          this.$store.dispatch('showMessage', {
            message: 'Goal created successfully!',
            type: 'success'
          });
        }
        
        this.closeForm();
        await this.loadData();
      } catch (error) {
        console.error('Error saving goal:', error);
        this.$store.dispatch('showMessage', {
          message: 'Failed to save goal. Please try again.',
          type: 'error'
        });
      } finally {
        this.isSaving = false;
      }
    },
    
    // Add helper method to format dates for input fields
    formatDateForInput(dateString) {
      if (!dateString) return '';
      
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        
        return date.toISOString().substr(0, 10); // Returns YYYY-MM-DD format
      } catch (error) {
        console.error('Error formatting date for input:', error);
        return '';
      }
    },
    
    // Add helper method to format dates for API
    formatDateForAPI(dateString) {
      if (!dateString) return null;
      
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return null;
        
        return date.toISOString(); // Returns full ISO format
      } catch (error) {
        console.error('Error formatting date for API:', error);
        return null;
      }
    },
    
    // Update getProgressPercentage to handle both uppercase and lowercase properties
    getProgressPercentage(goal) {
      if (!goal) return 0;
      if (goal.IsCompleted || goal.isCompleted) return 100;
      
      const startingValue = parseFloat(goal.StartingValue || goal.startingValue) || 0;
      const currentValue = parseFloat(goal.CurrentValue || goal.currentValue) || 0;
      const targetValue = parseFloat(goal.TargetValue || goal.targetValue) || 0;
      
      if (targetValue === startingValue) return 0;
      
      const progress = ((currentValue - startingValue) / (targetValue - startingValue)) * 100;
      
      // Handle cases where the goal is to decrease (e.g., weight loss)
      if (targetValue < startingValue) {
        const invertedProgress = ((startingValue - currentValue) / (startingValue - targetValue)) * 100;
        return Math.max(0, Math.min(100, invertedProgress));
      }
      
      return Math.max(0, Math.min(100, progress));
    },
    
    confirmDeleteGoal(id) {
      console.log('Confirming delete for goal ID:', id);
      this.goalToDeleteId = id;
      this.showDeleteConfirm = true;
    },
    
    async deleteGoal() {
      try {
        console.log('Deleting goal with ID:', this.goalToDeleteId);
        // Call the store action to delete the goal instead of calling self
        await this.$store.dispatch('deleteGoal', this.goalToDeleteId);
        this.$store.dispatch('showMessage', {
          message: 'Goal deleted successfully!',
          type: 'success'
        });
        this.showDeleteConfirm = false;
        this.goalToDeleteId = null;
        // Refresh goal list
        await this.loadData();
      } catch (error) {
        console.error('Error deleting goal:', error);
        this.$store.dispatch('showMessage', {
          message: 'Failed to delete goal. Please try again.',
          type: 'error'
        });
      }
    },
    
    formatDate(dateStr) {
      if (!dateStr) return 'Not set';
      
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'Invalid Date';
        
        // Use toLocaleDateString for consistent formatting
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch (error) {
        console.error('Error formatting date:', error);
        return 'Error';
      }
    },
    
    getMetricLabel(metricType) {
      const labels = {
        'weight': 'Body Weight',
        'workout_frequency': 'Workouts',
        'strength': 'Strength',
        'distance': 'Distance',
        'calories': 'Calories Burned'
      };
      
      return labels[metricType] || metricType;
    },
    
    getMetricUnit(metricType) {
      const units = {
        'weight': 'kg',
        'workout_frequency': 'workouts',
        'strength': 'kg',
        'distance': 'km',
        'calories': 'kcal'
      };
      
      return units[metricType] || '';
    },
    
    getGoalStatusClass(goal) {
      if (new Date(goal.targetDate) < new Date()) {
        return goal.currentValue >= goal.targetValue ? 'status-completed' : 'status-expired';
      }
      
      const progress = this.calculateProgress(goal);
      if (progress >= 100) return 'status-completed';
      if (progress >= 75) return 'status-on-track';
      if (progress >= 50) return 'status-in-progress';
      return 'status-started';
    },
    
    getGoalStatusText(goal) {
      if (new Date(goal.targetDate) < new Date()) {
        return goal.currentValue >= goal.targetValue ? 'Completed' : 'Expired';
      }
      
      const progress = this.calculateProgress(goal);
      if (progress >= 100) return 'Completed';
      if (progress >= 75) return 'On Track';
      if (progress >= 50) return 'In Progress';
      return 'Started';
    },
    
    calculateProgress(goal) {
      // For weight loss goals, progress is reversed
      if (goal.metricType === 'weight' && goal.targetValue < goal.startingValue) {
        if (goal.currentValue <= goal.targetValue) return 100;
        const totalChange = goal.startingValue - goal.targetValue;
        const currentChange = goal.startingValue - goal.currentValue;
        return Math.min(100, Math.max(0, (currentChange / totalChange) * 100));
      }
      
      // For typical increasing goals
      if (goal.currentValue >= goal.targetValue) return 100;
      const totalChange = goal.targetValue - goal.startingValue;
      const currentChange = goal.currentValue - goal.startingValue;
      return Math.min(100, Math.max(0, (currentChange / totalChange) * 100));
    },
    
    getProgressClass(goal) {
      const progress = this.calculateProgress(goal);
      if (progress >= 100) return 'progress-complete';
      if (progress >= 75) return 'progress-good';
      if (progress >= 50) return 'progress-medium';
      if (progress >= 25) return 'progress-started';
      return 'progress-initial';
    },
    
    updateUnitBasedOnMetricType() {
      // Set the appropriate unit based on the selected metric type
      const metricTypeToUnit = {
        'weight': 'kg',
        'workout_frequency': 'workouts',
        'strength': 'kg',
        'distance': 'km',
        'calories': 'kcal'
      };
      
      this.goalForm.unit = metricTypeToUnit[this.goalForm.metricType] || '';
      console.log(`Metric type changed to ${this.goalForm.metricType}, unit set to ${this.goalForm.unit}`);
    },
    
    // Enhanced debug method with more formats and structured output
    async enhancedDebug() {
      try {
        // Get user ID
        let userId = "user"; // Default fallback
        let authToken = null;
        
        try {
          // Attempt to get authentication token
          authToken = localStorage.getItem('auth_token');
          console.log("Auth token present:", !!authToken);
          
          // Attempt to get user profile
          const userProfile = localStorage.getItem('user_profile');
          if (userProfile) {
            const profile = JSON.parse(userProfile);
            userId = profile.sub || profile.email || "user";
            console.log("Using userId from profile:", userId);
          }
        } catch (e) {
          console.error('Error retrieving user authentication info:', e);
        }
        
        // Check if we have authentication
        if (!authToken) {
          console.warn("No authentication token found! Trying to retrieve from other sources...");
          
          // Try alternate storage locations
          authToken = localStorage.getItem('id_token') || 
                      localStorage.getItem('access_token') || 
                      sessionStorage.getItem('auth_token') ||
                      sessionStorage.getItem('id_token');
                      
          if (!authToken) {
            NotificationService.showError("Authentication required! Please login first.");
            throw new Error("No authentication token available. User must login first.");
          }
        }
        
        // Base properties for all payloads
        const baseGoalProps = {
          Name: "Enhanced Debug Goal",
          Description: "Created via enhanced debug method",
          Unit: "kg",
          User: userId,
          StartDate: "2023-01-01T00:00:00Z",
          TargetDate: "2023-12-31T00:00:00Z",
          StartingValue: 0,
          CurrentValue: 0,
          TargetValue: 100,
          MetricType: "weight",
          IsCompleted: false
        };
        
        // Try various payload formats
        const debugPayloads = [
          // 1. Standard CamelCase properties in nested object
          { goal: baseGoalProps },
          
          // 2. Pascal case properties in nested object
          { 
            goal: {
              ...baseGoalProps,
              // Ensure all properties are in PascalCase
              Id: null
            }
          },
          
          // 3. Using lowercase "goal" instead of camelCase "goal"
          { 
            "goal": {
              ...baseGoalProps
            }
          },
          
          // 4. Using uppercase "GOAL" 
          { 
            "GOAL": {
              ...baseGoalProps
            }
          },
          
          // 5. Directly using a Goal object without wrapping
          {
            ...baseGoalProps
          },
          
          // 6. Double nested for model binding
          {
            goal: {
              goal: {
                ...baseGoalProps
              }
            }
          },
          
          // 7. Different property formats
          {
            goal: {
              name: "Enhanced Debug Goal",
              description: "Created via enhanced debug method",
              unit: "kg",
              user: userId,
              startDate: "2023-01-01T00:00:00Z",
              targetDate: "2023-12-31T00:00:00Z",
              startingValue: 0,
              currentValue: 0,
              targetValue: 100,
              metricType: "weight",
              isCompleted: false
            }
          }
        ];
        
        // Get token for authentication
        const token = localStorage.getItem('auth_token');
        const apiUrl = '/api';
        const url = `${apiUrl}/Goals`;
        
        // Try each payload format
        const results = [];
        for (let i = 0; i < debugPayloads.length; i++) {
          const payload = debugPayloads[i];
          console.log(`ENHANCED DEBUG: Trying payload format ${i+1}:`, JSON.stringify(payload, null, 2));
          
          // Prepare request
          const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          };
          
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
          
          try {
            // Make the request
            const response = await fetch(url, {
              method: 'POST',
              headers,
              body: JSON.stringify(payload),
              mode: 'cors',
              credentials: 'include'
            });
            
            // Get the response data
            let responseData;
            try {
              responseData = await response.json();
            } catch (e) {
              responseData = { error: "Could not parse JSON response" };
            }
            
            // Log detailed results
            const result = {
              format: i+1,
              status: response.status,
              success: response.ok,
              payload: payload,
              response: responseData
            };
            
            results.push(result);
            
            console.log(`ENHANCED DEBUG: Format ${i+1} result:`, {
              status: response.status,
              success: response.ok,
              responseData
            });
            
            // If successful, update UI and exit
            if (response.ok) {
              console.log(`SUCCESS! Format ${i+1} worked:`, responseData);
              NotificationService.showSuccess(`Enhanced debug goal created with format ${i+1}!`);
              this.closeForm();
              this.$store.dispatch('fetchGoals');
              return responseData;
            }
          } catch (error) {
            console.error(`ERROR: Format ${i+1} threw exception:`, error);
            results.push({
              format: i+1,
              status: "Exception",
              success: false,
              payload: payload,
              error: error.message
            });
          }
        }
        
        // Log all results for comparison
        console.log("ENHANCED DEBUG: Combined results from all formats:", results);
        
        // If we reach here, all formats failed
        // Try to analyze the errors for patterns
        let errorPatterns = {};
        results.forEach(result => {
          if (!result.success && result.response && result.response.errors) {
            Object.keys(result.response.errors).forEach(field => {
              if (!errorPatterns[field]) {
                errorPatterns[field] = 0;
              }
              errorPatterns[field]++;
            });
          }
        });
        
        console.log("ENHANCED DEBUG: Error field patterns:", errorPatterns);
        NotificationService.showError(`Enhanced Debug: All ${debugPayloads.length} formats failed. See console for details.`);
        
        return { success: false, results };
      } catch (error) {
        console.error("ENHANCED DEBUG: Uncaught exception:", error);
        NotificationService.showError(`Enhanced Debug error: ${error.message}`);
        return { success: false, error: error.message };
      }
    },
    
    // Final debug approach with improved authentication
    async finalDebugApproach() {
      try {
        // STEP 1: Get authentication token from all possible sources
        let authToken = localStorage.getItem('auth_token') || 
                         localStorage.getItem('id_token') || 
                         localStorage.getItem('access_token') || 
                         sessionStorage.getItem('auth_token') ||
                         sessionStorage.getItem('id_token');
                         
        console.log("Auth token found:", !!authToken);
        
        // Check if we have authentication
        if (!authToken) {
          console.error("No authentication token found in any storage!");
          NotificationService.showError("Authentication required! Please login first.");
          this.$router.push('/login'); // Redirect to login
          return { success: false, error: "Not authenticated" };
        }
        
        // STEP 2: Create goal data - DIRECT OBJECT (no wrapper)
        // Create the goal data directly without a "goal" wrapper
        const goalData = this.createApiGoalObject();
        
        console.log("FINAL DEBUG: Sending goal payload directly (no wrapper):", JSON.stringify(goalData, null, 2));
        
        const apiUrl = '/api';
        const url = `${apiUrl}/Goals`;
        
        // STEP 3: Ensure proper Authorization header format
        // Make sure the token has 'Bearer ' prefix if it doesn't already
        if (authToken && !authToken.startsWith('Bearer ')) {
          authToken = `Bearer ${authToken}`;
        }
        
        // Prepare headers with proper Authorization
        const headers = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': authToken
        };
        
        console.log("Request headers:", {
          'Content-Type': headers['Content-Type'],
          'Accept': headers['Accept'],
          'Authorization': authToken.substring(0, 20) + '...' // Log partial token for security
        });
        
        // STEP 4: Make the API call with proper credentials
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(goalData),
          credentials: 'include', // Include cookies if any
          mode: 'cors'
        });
        
        // STEP 5: Handle response with detailed logging
        console.log("FINAL DEBUG: Response status:", response.status);
        console.log("FINAL DEBUG: Response status text:", response.statusText);
        
        // Log all response headers for debugging
        const responseHeaders = {};
        for (const [key, value] of response.headers.entries()) {
          responseHeaders[key] = value;
        }
        console.log("FINAL DEBUG: Response headers:", responseHeaders);
        
        let responseData;
        try {
          responseData = await response.json();
        } catch (e) {
          responseData = { error: "Could not parse JSON response", message: e.message };
        }
        
        console.log("FINAL DEBUG: Response data:", responseData);
        
        // STEP 6: Handle different response scenarios
        if (response.ok) {
          NotificationService.showSuccess("Goal created successfully!");
          this.closeForm();
          this.$store.dispatch('fetchGoals');
          return { success: true, result: responseData };
        } else if (response.status === 401) {
          console.error("AUTHENTICATION ERROR (401): ", responseData);
          console.log("Auth token issues. First 30 chars:", authToken.substring(0, 30) + "...");
          
          // Clear invalid tokens and redirect to login
          localStorage.removeItem('auth_token');
          NotificationService.showError("Your session has expired. Please login again.");
          
          // Give more specific guidance
          setTimeout(() => {
            this.$router.push('/login');
          }, 2000);
          
          return { success: false, error: "Authentication failed", status: 401 };
        } else if (response.status === 400) {
          let errorMessage = "Validation error: ";
          
          // Format validation errors for display
          if (responseData.errors) {
            Object.keys(responseData.errors).forEach(key => {
              errorMessage += `${key}: ${responseData.errors[key].join(", ")}; `;
            });
          } else {
            errorMessage += responseData.title || "Unknown validation error";
          }
          
          console.error("Validation errors:", responseData.errors || responseData);
          NotificationService.showError(errorMessage);
          return { success: false, error: responseData, status: 400 };
        } else {
          console.error("API error:", responseData);
          NotificationService.showError(`Failed to create goal: ${response.status} - ${responseData.title || 'Unknown error'}`);
          return { success: false, error: responseData };
        }
      } catch (error) {
        console.error("FINAL DEBUG: Exception:", error);
        NotificationService.showError(`Error: ${error.message}`);
        return { success: false, error: error.message };
      }
    },
    
    // Convert our form data to the API expected format
    createApiGoalObject() {
      // Get user ID - this is required by the API
      let userId = "";
      try {
        const userProfile = localStorage.getItem('user_profile');
        if (userProfile) {
          const profile = JSON.parse(userProfile);
          userId = profile.sub || profile.email || "defaultUser";
          console.log("Using userId from profile:", userId);
        }
      } catch (e) {
        console.error('Error retrieving user ID:', e);
      }
      
      // Format dates correctly
      const startDate = new Date(this.goalForm.startDate).toISOString();
      const targetDate = new Date(this.goalForm.targetDate).toISOString();
      
      // Make sure the User field is properly formatted
      return {
        "Name": this.goalForm.name || "New Goal", // Add a default to ensure it's never empty
        "Description": this.goalForm.description || "Goal created from workout tracker",
        "Unit": this.goalForm.unit || "kg", // Add a default to ensure it's never empty
        "User": {
          "Auth0Id": userId
        },
        "StartDate": startDate,
        "TargetDate": targetDate,
        "StartingValue": this.goalForm.startingValue || 0,
        "CurrentValue": this.goalForm.currentValue || 0,
        "TargetValue": this.goalForm.targetValue || 0,
        "MetricType": this.goalForm.metricType || "weight",
        "IsCompleted": this.goalForm.isCompleted || false,
        // Include ID if editing an existing goal
        ...(this.goalForm.id ? { "Id": this.goalForm.id } : {})
      };
    },
    
    // Check if the user is authenticated
    async checkAuthentication() {
      try {
        // Get authentication token from various possible storage locations
        const authToken = localStorage.getItem('auth_token') || 
                         localStorage.getItem('id_token') || 
                         localStorage.getItem('access_token') || 
                         sessionStorage.getItem('auth_token');
        
        if (!authToken) {
          console.error("No authentication token found in storage");
          this.authError = true;
          this.authErrorMessage = 'Authentication required. Please log in to continue.';
          return false;
        }
        
        // Optionally, we could verify the token by making a lightweight API call
        // But for now, we'll just check if it exists
        
        // Get user profile to verify we have user information
        const userProfile = localStorage.getItem('user_profile');
        if (!userProfile) {
          console.warn("Auth token found, but no user profile available");
        } else {
          console.log("User authenticated with profile");
        }
        
        // Token exists, consider authenticated at this stage
        return true;
      } catch (error) {
        console.error("Error checking authentication:", error);
        this.authError = true;
        this.authErrorMessage = 'An error occurred during authentication check.';
        return false;
      }
    },
    
    redirectToLogin() {
      this.$router.push('/login');
    },
    
    // Add after the final debug methods
    async debugAuth() {
      // Show status notification
      NotificationService.showInfo("Running authentication diagnostics...");
      
      try {
        // STEP 1: Check if token exists and retrieve it
        let authToken = localStorage.getItem('auth_token') || 
                         localStorage.getItem('id_token') || 
                         localStorage.getItem('access_token') || 
                         sessionStorage.getItem('auth_token') ||
                         sessionStorage.getItem('id_token');
        
        if (!authToken) {
          console.error("No auth token found in any storage location!");
          NotificationService.showError("Authentication error: No token found");
          return;
        }
        
        console.log("Auth token found with length:", authToken.length);
        
        // STEP 2: Analyze token format and structure
        let tokenPayload = null;
        let isValidJWT = false;
        try {
          // Check if token is a JWT and decode it
          const parts = authToken.split('.');
          if (parts.length === 3) {
            isValidJWT = true;
            // Decode the payload (middle part)
            const encodedPayload = parts[1];
            const decodedString = atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/'));
            tokenPayload = JSON.parse(decodedString);
            console.log("Token decoded successfully:", tokenPayload);
            
            // Check token expiration
            if (tokenPayload.exp) {
              const expirationDate = new Date(tokenPayload.exp * 1000);
              const now = new Date();
              if (expirationDate < now) {
                console.error("TOKEN IS EXPIRED! Expired at:", expirationDate);
                NotificationService.showError(`Auth token expired on ${expirationDate.toLocaleString()}`);
              } else {
                console.log("Token is valid until:", expirationDate.toLocaleString());
                NotificationService.showInfo(`Token valid until ${expirationDate.toLocaleString()}`);
              }
            }
            
            // Check audience
            if (tokenPayload.aud) {
              console.log("Token audience:", tokenPayload.aud);
            }
          } else {
            console.warn("Token does not appear to be a valid JWT (doesn't have 3 parts)");
          }
        } catch (e) {
          console.error("Failed to decode token:", e);
        }
        
        // STEP 3: Make a test call to the API with more debugging
        try {
          // Prepare for test API call
          if (!authToken.startsWith('Bearer ')) {
            authToken = `Bearer ${authToken}`;
          }
          
          const apiUrl = '/api';
          
          // First try /api/users/me which might create the user if it doesn't exist
          console.log("Making test call to /api/Users/me to verify user exists...");
          const userResponse = await fetch(`${apiUrl}/Users/me`, {
            method: 'GET',
            headers: {
              'Authorization': authToken,
              'Accept': 'application/json'
            },
            credentials: 'include'
          });
          
          console.log("Users/me response status:", userResponse.status);
          
          let userData;
          try {
            userData = await userResponse.json();
            console.log("User data:", userData);
            
            if (userResponse.ok) {
              NotificationService.showSuccess("User exists in the database!");
            } else if (userResponse.status === 401) {
              NotificationService.showError("Authentication failed when checking user");
            }
          } catch (e) {
            console.error("Could not parse user response:", e);
          }
          
          // Now try the goals endpoint specifically
          console.log("Making test call to /api/Goals...");
          const response = await fetch(`${apiUrl}/Goals`, {
            method: 'GET',
            headers: {
              'Authorization': authToken,
              'Accept': 'application/json'
            },
            credentials: 'include'
          });
          
          console.log("Goals API test response status:", response.status);
          
          // Log all response headers for debugging
          const responseHeaders = {};
          for (const [key, value] of response.headers.entries()) {
            responseHeaders[key] = value;
          }
          console.log("Response headers:", responseHeaders);
          
          if (response.status === 401) {
            NotificationService.showError("Authentication failed (401) - See console for details");
            console.error("Authentication failed with the Goals API.");
            
            if (userResponse.ok) {
              console.log("INTERESTING: User endpoint works but Goals fails - likely a permission issue");
              NotificationService.showInfo("User exists but doesn't have permission for Goals");
            }
          } else if (response.ok) {
            NotificationService.showSuccess("Goals API authentication successful!");
          }
          
          // Try to get the response data
          try {
            const data = await response.json();
            console.log("API response data:", data);
          } catch (e) {
            console.error("Could not parse API response:", e);
          }
        } catch (e) {
          console.error("Error making test API call:", e);
          NotificationService.showError(`API test error: ${e.message}`);
        }
        
        // STEP 4: Display diagnostic information
        if (tokenPayload) {
          console.log("AUTH DIAGNOSTICS SUMMARY:");
          console.log("- Token is a valid JWT:", isValidJWT);
          console.log("- User ID/Subject:", tokenPayload.sub);
          console.log("- Issuer:", tokenPayload.iss);
          console.log("- Audience:", tokenPayload.aud);
          console.log("- Issued at:", new Date(tokenPayload.iat * 1000).toLocaleString());
          console.log("- Expires at:", new Date(tokenPayload.exp * 1000).toLocaleString());
          
          // Check common issues
          const expectedAudience = process.env.VUE_APP_AUTH0_AUDIENCE || "https://workouttracker-api"; // Updated to use Auth0 audience
          if (Array.isArray(tokenPayload.aud)) {
            if (!tokenPayload.aud.includes(expectedAudience)) {
              console.warn(`Token audience might be incorrect. Expected ${expectedAudience} in`, tokenPayload.aud);
            }
          } else if (tokenPayload.aud !== expectedAudience) {
            console.warn(`Token audience might be incorrect. Expected ${expectedAudience} but got ${tokenPayload.aud}`);
          }
          
          if (!tokenPayload.scope && !tokenPayload.permissions) {
            console.warn("Token doesn't contain scope or permissions");
          }
        }
        
        // Success message
        console.log("Auth diagnostics completed. Check console for detailed results.");
        NotificationService.showInfo("Auth diagnostics completed. Check console.");
        
      } catch (error) {
        console.error("Auth diagnostics error:", error);
        NotificationService.showError(`Auth diagnostics error: ${error.message}`);
      }
    },
    
    async fetchGoalsFromApi() {
      try {
        console.log('Fetching goals directly from API');
        const response = await ApiService.get('Goals');
        console.log('Goals API response:', response);
        
        // Handle the new response format with proper case conversion
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
          // Handle potential single object response
          if (response.Id || response.id) {
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
          } else if (Array.isArray(response.value)) {
            // Handle potential OData response format
            console.log('Processing OData response format');
            processedGoals = response.value.map(goal => ({
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
        }
        
        console.log('Processed goals:', processedGoals);
        this.$store.commit('setGoals', processedGoals);
      } catch (error) {
        console.error('Error fetching goals directly from API:', error);
        NotificationService.showError('Failed to load goals. Please try again.');
      }
    },
  },
  created() {
    console.log('Goals component created - checking for authentication');
    
    // Simple pre-check for token before attempting to load data
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.warn('No authentication token found in localStorage');
      this.authError = true;
      this.authErrorMessage = 'Please log in to view and manage your fitness goals.';
      this.loading = false;
      return;
    }
    
    // If token exists, proceed with authentication check and data loading
    this.checkAuthentication().then(isAuthenticated => {
      if (isAuthenticated) {
        console.log('User is authenticated, loading goals data');
        this.loadData();
      } else {
        console.warn('Authentication check failed');
        this.authError = true;
        this.authErrorMessage = 'Your session is invalid or has expired. Please log in again.';
        this.loading = false;
      }
    }).catch(error => {
      console.error("Authentication check error:", error);
      this.authError = true;
      this.authErrorMessage = 'An error occurred while checking your authentication. Please try again.';
      NotificationService.showError("Authentication check failed");
      this.loading = false;
    });
  }
};
</script>

<style scoped>
.goals {
  padding: 20px 0;
}

.goals-container {
  margin-top: 20px;
}

/* Authentication error styling */
.auth-error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  margin-top: 20px;
}

.auth-error {
  max-width: 500px;
  margin: 0 auto;
  padding: 30px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.auth-error h3 {
  color: #e74c3c;
  margin-bottom: 15px;
}

.auth-error i {
  color: #e74c3c;
}

.auth-error p {
  margin-bottom: 20px;
  color: #555;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.goals-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.goal-card {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.goal-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.goal-status {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-completed {
  background-color: var(--success-color);
  color: white;
}

.status-on-track {
  background-color: #27ae60;
  color: white;
}

.status-in-progress {
  background-color: var(--primary-color);
  color: white;
}

.status-started {
  background-color: var(--warning-color);
  color: white;
}

.status-expired {
  background-color: var(--danger-color);
  color: white;
}

.goal-actions {
  display: flex;
  gap: 10px;
}

.btn-icon {
  background: none;
  border: none;
  color: var(--dark-color);
  font-size: 1rem;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.btn-icon:hover {
  opacity: 1;
}

.goal-title {
  margin-bottom: 8px;
}

.goal-description {
  margin-bottom: 15px;
  color: #666;
}

.goal-dates {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
}

.goal-date {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.goal-metrics {
  margin-bottom: 20px;
}

.goal-metric {
  margin-bottom: 10px;
}

.metric-label {
  font-weight: 500;
  margin-bottom: 5px;
}

.progress-bar {
  height: 8px;
  background-color: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 5px;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-complete {
  background-color: var(--success-color);
}

.progress-good {
  background-color: #27ae60;
}

.progress-medium {
  background-color: var(--primary-color);
}

.progress-started {
  background-color: var(--warning-color);
}

.progress-initial {
  background-color: #6c757d;
}

.progress-text {
  font-size: 0.85rem;
  color: #666;
}

.goal-update {
  margin-top: 10px;
  text-align: right;
}

/* Form Overlay */
.goal-form-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  overflow-y: auto;
  padding: 20px;
}

.goal-form-container {
  width: 100%;
  max-width: 650px;
  max-height: 90vh;
  overflow-y: auto;
}

.goal-form-container .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-row {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.form-row .form-group {
  flex: 1;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

/* Confirmation Modal */
.confirmation-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.confirmation-content {
  width: 100%;
  max-width: 500px;
}

.confirmation-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

/* Loading and Empty States */
.loading-indicator, .empty-state {
  padding: 40px 0;
  text-align: center;
}

.empty-state .card {
  max-width: 500px;
  margin: 0 auto;
  padding: 30px;
}

@media (max-width: 768px) {
  .goals-list {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    flex-direction: column;
    gap: 10px;
  }
}
</style> 