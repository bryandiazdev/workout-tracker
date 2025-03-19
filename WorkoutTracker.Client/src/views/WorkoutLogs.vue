<template>
  <div class="workout-logs">
    <h1>Workout Logs</h1>
    
    <div class="workout-logs-container">
      <div class="logs-section">
        <div class="section-header">
          <h2>Your Workout History</h2>
          <button class="btn btn-primary" @click="showLogForm = true">
            <i class="fas fa-plus"></i> Log New Workout
          </button>
        </div>
        
        <div v-if="loading" class="loading-indicator">
          <p>Loading your workout logs...</p>
        </div>
        
        <div v-else-if="workoutLogs.length === 0" class="empty-state">
          <div class="card">
            <div class="card-body text-center">
              <i class="fas fa-dumbbell fa-3x mb-3"></i>
              <h3>No Workout Logs Yet</h3>
              <p>Start tracking your fitness journey by logging your first workout.</p>
              <button class="btn btn-primary mt-3" @click="showLogForm = true">
                Log Your First Workout
              </button>
            </div>
          </div>
        </div>
        
        <div v-else class="logs-list">
          <div v-for="(log, index) in workoutLogs" :key="log.id" class="log-card card">
            <div class="card-header">
              <h3>{{ formatDate(log.workoutDate || log.date || log.createdDate) }}</h3>
              <div class="log-actions">
                <button class="btn-icon" @click="editLog(log)">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon" @click="confirmDeleteLog(log.id)">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
            </div>
            <div class="card-body">
              <h4>{{ log.workoutPlan ? log.workoutPlan.name : 'Custom Workout' }}</h4>
              <div class="log-details">
                <div class="log-stat">
                  <i class="fas fa-clock"></i>
                  <span>{{ formatDuration(log.duration) }}</span>
                </div>
              </div>
              
              <div class="exercises-list">
                <h5>Exercises</h5>
                <ul v-if="log.exerciseLogs && log.exerciseLogs.length > 0">
                  <li v-for="exercise in log.exerciseLogs" :key="exercise.id">
                    <div class="exercise-item">
                      <span class="exercise-name">{{ exercise.exerciseName }}</span>
                      <span class="exercise-detail">
                        {{ exercise.sets }} sets × {{ exercise.reps }} reps
                        <template v-if="exercise.weight">
                          × {{ exercise.weight }} {{ exercise.weightUnit || 'kg' }}
                        </template>
                      </span>
                    </div>
                  </li>
                </ul>
                <!-- Try exercises array if exerciseLogs is not available -->
                <ul v-else-if="log.exercises && log.exercises.length > 0">
                  <li v-for="exercise in log.exercises" :key="exercise.id">
                    <div class="exercise-item">
                      <span class="exercise-name">{{ exercise.exerciseName || exercise.name }}</span>
                      <span class="exercise-detail">
                        {{ exercise.sets }} sets × {{ exercise.reps }} reps
                        <template v-if="exercise.weight">
                          × {{ exercise.weight }} {{ exercise.weightUnit || 'kg' }}
                        </template>
                      </span>
                    </div>
                  </li>
                </ul>
                <p v-else>No exercises recorded for this workout.</p>
              </div>
              
              <div class="log-notes" v-if="log.notes">
                <h5>Notes</h5>
                <p>{{ log.notes }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Log Form -->
      <div v-if="showLogForm" class="log-form-overlay">
        <div class="log-form-container card">
          <div class="card-header">
            <h3>{{ isEditing ? 'Edit Workout Log' : 'Log New Workout' }}</h3>
            <button class="btn-icon" @click="closeForm">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="card-body">
            <form @submit.prevent="saveWorkoutLog">
              <div class="form-group">
                <label for="workout-date">Date</label>
                <input 
                  type="date" 
                  id="workout-date" 
                  class="form-control" 
                  v-model="logForm.date" 
                  required
                >
              </div>
              
              <div class="form-group">
                <label for="workout-plan">Workout Plan (Optional)</label>
                <select id="workout-plan" class="form-control" v-model="logForm.workoutPlanId">
                  <option value="">Custom Workout</option>
                  <option 
                    v-for="plan in workoutPlans" 
                    :key="plan.id" 
                    :value="plan.id"
                  >
                    {{ plan.name }}
                  </option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="workout-duration">Duration (minutes)</label>
                <input 
                  type="number" 
                  id="workout-duration" 
                  class="form-control" 
                  v-model.number="logForm.duration" 
                  min="1" 
                  required
                >
              </div>
              
              <div class="form-group">
                <label for="calories-burned">Calories Burned (estimated)</label>
                <input 
                  type="number" 
                  id="calories-burned" 
                  class="form-control" 
                  v-model.number="logForm.caloriesBurned" 
                  min="0"
                >
              </div>
              
              <div class="exercises-form-section">
                <h4>Exercises</h4>
                <div 
                  v-for="(exercise, index) in logForm.exercises" 
                  :key="index" 
                  class="exercise-form-item"
                >
                  <div class="form-row">
                    <div class="form-group">
                      <label :for="`exercise-name-${index}`">Exercise Name</label>
                      <input 
                        :id="`exercise-name-${index}`" 
                        type="text" 
                        class="form-control" 
                        v-model="exercise.name" 
                        required
                      >
                    </div>
                    
                    <div class="form-group">
                      <label :for="`exercise-sets-${index}`">Sets</label>
                      <input 
                        :id="`exercise-sets-${index}`" 
                        type="number" 
                        class="form-control" 
                        v-model.number="exercise.sets" 
                        min="1" 
                        required
                      >
                    </div>
                    
                    <div class="form-group">
                      <label :for="`exercise-reps-${index}`">Reps</label>
                      <input 
                        :id="`exercise-reps-${index}`" 
                        type="number" 
                        class="form-control" 
                        v-model.number="exercise.reps" 
                        min="1" 
                        required
                      >
                    </div>
                  </div>
                  
                  <div class="form-row">
                    <div class="form-group">
                      <label :for="`exercise-weight-${index}`">Weight (optional)</label>
                      <input 
                        :id="`exercise-weight-${index}`" 
                        type="number" 
                        class="form-control" 
                        v-model.number="exercise.weight" 
                        min="0"
                      >
                    </div>
                    
                    <div class="form-group">
                      <label :for="`exercise-weight-unit-${index}`">Unit</label>
                      <select 
                        :id="`exercise-weight-unit-${index}`" 
                        class="form-control" 
                        v-model="exercise.weightUnit"
                      >
                        <option value="kg">kg</option>
                        <option value="lbs">lbs</option>
                      </select>
                    </div>
                    
                    <button 
                      type="button" 
                      class="btn btn-danger remove-exercise-btn" 
                      @click="removeExercise(index)"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                
                <button 
                  type="button" 
                  class="btn btn-secondary add-exercise-btn" 
                  @click="addExercise"
                >
                  Add Exercise
                </button>
              </div>
              
              <div class="form-group">
                <label for="workout-notes">Notes</label>
                <textarea 
                  id="workout-notes" 
                  class="form-control" 
                  v-model="logForm.notes" 
                  rows="3"
                ></textarea>
              </div>
              
              <div class="form-actions">
                <button type="button" class="btn btn-secondary" @click="closeForm">
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary">
                  {{ isEditing ? 'Update' : 'Save' }}
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
            <h3>Delete Workout Log</h3>
          </div>
          <div class="card-body">
            <p>Are you sure you want to delete this workout log? This action cannot be undone.</p>
            <div class="confirmation-actions">
              <button class="btn btn-secondary" @click="showDeleteConfirm = false">
                Cancel
              </button>
              <button class="btn btn-danger" @click="deleteLog">
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import NotificationService from '../services/NotificationService';

export default {
  name: 'WorkoutLogs',
  data() {
    return {
      loading: true,
      showLogForm: false,
      isEditing: false,
      showDeleteConfirm: false,
      logToDeleteId: null,
      logForm: this.getEmptyLogForm()
    };
  },
  computed: {
    ...mapState(['workoutLogs', 'workoutPlans'])
  },
  methods: {
    ...mapActions(['fetchWorkoutLogs', 'fetchWorkoutPlans', 'createWorkoutLog', 'updateWorkoutLog', 'deleteWorkoutLog']),
    
    getEmptyLogForm() {
      return {
        id: null,
        date: new Date().toISOString().substr(0, 10),
        workoutPlanId: '',
        duration: 45,
        caloriesBurned: 0,
        notes: '',
        exercises: [this.getEmptyExercise()]
      };
    },
    
    getEmptyExercise() {
      return {
        name: '',
        sets: 3,
        reps: 10,
        weight: null,
        weightUnit: 'kg'
      };
    },
    
    addExercise() {
      this.logForm.exercises.push(this.getEmptyExercise());
    },
    
    removeExercise(index) {
      if (this.logForm.exercises.length > 1) {
        this.logForm.exercises.splice(index, 1);
      } else {
        NotificationService.showWarning('You need at least one exercise in your workout');
      }
    },
    
    async loadData() {
      this.loading = true;
      try {
        await Promise.all([
          this.fetchWorkoutLogs(),
          this.fetchWorkoutPlans()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
        NotificationService.showError('Failed to load workout data');
      } finally {
        this.loading = false;
      }
    },
    
    editLog(log) {
      this.isEditing = true;
      
      // Deep copy the log data to avoid modifying the store directly
      this.logForm = {
        id: log.id,
        date: new Date(log.workoutDate).toISOString().substr(0, 10),
        workoutPlanId: log.workoutPlanId || '',
        duration: this.getDurationInMinutes(log.duration),
        notes: log.notes || '',
        exercises: (log.exerciseLogs || []).map(ex => ({
          name: ex.exerciseName,
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight,
          weightUnit: 'kg'
        }))
      };
      
      if (this.logForm.exercises.length === 0) {
        this.logForm.exercises = [this.getEmptyExercise()];
      }
      
      this.showLogForm = true;
    },
    
    closeForm() {
      this.showLogForm = false;
      this.isEditing = false;
      this.logForm = this.getEmptyLogForm();
    },
    
    async saveWorkoutLog() {
      try {
        console.log('Saving workout log with form data:', JSON.stringify(this.logForm));
        
        // Ensure ID is a valid integer
        const logFormCopy = { ...this.logForm };
        
        // Convert ID to a valid integer if present, otherwise null (for new logs)
        if (logFormCopy.id !== null) {
          logFormCopy.id = parseInt(logFormCopy.id, 10) || null;
        }
        
        // Format date properly for C# DateTime parsing
        const workoutDate = new Date(logFormCopy.date);
        
        // Format data for API
        const formattedLog = {
          id: logFormCopy.id,
          // Format as full ISO string that C# can parse reliably
          workoutDate: workoutDate.toISOString(),
          // Convert duration from minutes to a proper TimeSpan format (hh:mm:ss)
          duration: this.formatDurationForApi(logFormCopy.duration),
          notes: logFormCopy.notes || '',
          workoutPlanId: logFormCopy.workoutPlanId ? parseInt(logFormCopy.workoutPlanId, 10) : null,
          exerciseLogs: (logFormCopy.exercises || []).map(ex => ({
            exerciseName: ex.name,
            sets: parseInt(ex.sets, 10),
            reps: parseInt(ex.reps, 10),
            weight: ex.weight ? parseFloat(ex.weight) : null,
            notes: '',
            duration: null
          }))
        };
        
        console.log('Formatted log to send to API:', JSON.stringify(formattedLog));
        
        if (this.isEditing) {
          await this.updateWorkoutLog(formattedLog);
          NotificationService.showSuccess('Workout log updated successfully');
        } else {
          await this.createWorkoutLog(formattedLog);
          NotificationService.showSuccess('Workout logged successfully');
        }
        this.closeForm();
      } catch (error) {
        console.error('Error saving workout log:', error);
        NotificationService.showError('Failed to save workout log: ' + (error.response?.data?.message || error.message));
      }
    },
    
    formatDurationForApi(minutes) {
      // Convert minutes to TimeSpan format (hh:mm:ss)
      if (!minutes || isNaN(minutes)) {
        // Default to 30 minutes if invalid
        minutes = 30;
      }
      
      // Calculate hours and remaining minutes
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      
      // Format as HH:MM:00 (no seconds)
      // NOTE: We're putting the minutes in the middle position (MM) to be clear
      // Since we want the API to interpret this as X hours and Y minutes, not seconds
      // Example: "00:46:00" should be parsed as 46 minutes, not 46 seconds
      const timespan = `${hours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}:00`;
      console.log(`Formatting ${minutes} minutes as TimeSpan: ${timespan}`);
      return timespan;
    },
    
    confirmDeleteLog(id) {
      this.logToDeleteId = id;
      this.showDeleteConfirm = true;
    },
    
    async deleteLog() {
      try {
        await this.deleteWorkoutLog(this.logToDeleteId);
        NotificationService.showSuccess('Workout log deleted');
        this.showDeleteConfirm = false;
        this.logToDeleteId = null;
      } catch (error) {
        console.error('Error deleting workout log:', error);
        NotificationService.showError('Failed to delete workout log');
      }
    },
    
    formatDate(dateString) {
      if (!dateString) return 'Invalid Date';
      
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString(undefined, options);
      } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid Date';
      }
    },
    
    formatDuration(duration) {
      if (!duration) return '0 minutes';
      
      // Check if duration is already a string with the expected format like "00:45:00"
      if (typeof duration === 'string' && duration.includes(':')) {
        const parts = duration.split(':');
        const hours = parseInt(parts[0]);
        const minutes = parseInt(parts[1]);
        
        if (hours > 0) {
          return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
        } else {
          return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
        }
      }
      
      // Handle numeric duration (minutes)
      if (!isNaN(duration)) {
        return `${duration} minute${duration !== 1 ? 's' : ''}`;
      }
      
      return '0 minutes';
    },
    
    getDurationInMinutes(duration) {
      if (!duration) return 30; // Default to 30 minutes
      
      // Check if duration is a string with the expected format like "00:45:00"
      if (typeof duration === 'string' && duration.includes(':')) {
        const parts = duration.split(':');
        const hours = parseInt(parts[0]);
        const minutes = parseInt(parts[1]);
        
        return (hours * 60) + minutes;
      }
      
      // If it's already a number, just return it
      return typeof duration === 'number' ? duration : 30;
    }
  },
  created() {
    this.loadData();
  }
};
</script>

<style scoped>
.workout-logs {
  padding: 20px 0;
}

.workout-logs-container {
  margin-top: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.logs-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.log-card {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.log-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.log-actions {
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

.log-details {
  display: flex;
  gap: 20px;
  margin: 10px 0;
}

.log-stat {
  display: flex;
  align-items: center;
  gap: 5px;
}

.exercises-list {
  margin-top: 15px;
}

.exercises-list ul {
  list-style-type: none;
  padding-left: 0;
}

.exercise-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.exercise-item:last-child {
  border-bottom: none;
}

.log-notes {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

/* Form Overlay */
.log-form-overlay {
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

.log-form-container {
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.log-form-container .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.exercises-form-section {
  margin: 20px 0;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.exercise-form-item {
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.form-row {
  display: flex;
  gap: 15px;
  margin-bottom: 10px;
}

.form-row .form-group {
  flex: 1;
}

.remove-exercise-btn {
  align-self: flex-end;
  margin-bottom: 8px;
}

.add-exercise-btn {
  width: 100%;
  margin-top: 10px;
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
  .logs-list {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    flex-direction: column;
    gap: 10px;
  }
}
</style> 