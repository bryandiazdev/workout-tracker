<template>
  <div class="workout-plans">
    <h1 class="page-title">Workout Plans</h1>
    
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading your workout plans...</p>
    </div>
    
    <div v-else>
      <div class="actions">
        <button class="btn btn-primary" @click="openCreateModal">
          <i class="fas fa-plus"></i> Create New Plan
        </button>
      </div>
      
      <div v-if="workoutPlans.length === 0" class="no-data">
        <p>You haven't created any workout plans yet.</p>
        <p>Create your first workout plan to get started.</p>
        <button class="btn btn-primary" @click="openCreateModal">
          <i class="fas fa-plus"></i> Create Workout Plan
        </button>
      </div>
      
      <div v-else class="plans-grid">
        <div v-for="plan in workoutPlans" :key="plan.id" class="plan-card">
          <div class="plan-header">
            <h2>{{ getPlanName(plan) }}</h2>
            <div class="plan-actions">
              <button class="btn-icon" @click="viewPlan(plan)">
                <i class="fas fa-eye"></i>
              </button>
              <button class="btn-icon" @click="openEditModal(plan)">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn-icon" @click="confirmDeletePlan(plan)">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
          
          <p class="plan-description">{{ getPlanDescription(plan) }}</p>
          
          <div class="plan-stats">
            <div class="plan-stat">
              <i class="fas fa-dumbbell"></i>
              <span>{{ plan.exercises ? plan.exercises.length : 0 }} Exercises</span>
            </div>
            <div class="plan-stat">
              <i class="fas fa-calendar"></i>
              <span>Created {{ formatDate(plan.createdAt) }}</span>
            </div>
          </div>
          
          <div class="plan-footer">
            <button class="btn btn-outline" @click="viewPlan(plan)">
              View Details
            </button>
          </div>
        </div>
      </div>
      
      <!-- Plan Details Modal -->
      <div v-if="selectedPlan" class="modal-overlay" @click.self="closeDetails">
        <div class="modal-container">
          <div class="modal-header">
            <h2>{{ selectedPlan.name }}</h2>
            <button class="btn-close" @click="closeDetails">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="modal-body">
            <div class="plan-detail-description">
              <h3>Description</h3>
              <p>{{ selectedPlan.description || 'No description provided' }}</p>
            </div>
            
            <div class="exercises-section">
              <div class="exercises-header">
                <h3>Exercises</h3>
                <button class="btn btn-sm btn-primary" @click="openAddExerciseModal">
                  <i class="fas fa-plus"></i> Add Exercise
                </button>
              </div>
              
              <div v-if="!selectedPlan.exercises || selectedPlan.exercises.length === 0" class="no-exercises">
                <p>No exercises in this plan yet.</p>
                <button class="btn btn-primary" @click="openAddExerciseModal">
                  <i class="fas fa-plus"></i> Add First Exercise
                </button>
              </div>
              
              <div v-else class="exercises-list">
                <div v-for="(exercise, index) in selectedPlan.exercises" :key="exercise.id" class="exercise-item">
                  <div class="exercise-header">
                    <h4>{{ index + 1 }}. {{ exercise.name }}</h4>
                    <div class="exercise-actions">
                      <button class="btn-icon" @click="openEditExerciseModal(exercise)">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="btn-icon" @click="confirmDeleteExercise(exercise)">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                  
                  <p class="exercise-description">{{ exercise.description || 'No description' }}</p>
                  
                  <div class="exercise-details">
                    <div class="detail-item">
                      <span class="detail-label">Sets:</span>
                      <span class="detail-value">{{ exercise.sets }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Reps:</span>
                      <span class="detail-value">{{ exercise.reps }}</span>
                    </div>
                    <div v-if="exercise.weight" class="detail-item">
                      <span class="detail-label">Weight:</span>
                      <span class="detail-value">{{ exercise.weight }} kg</span>
                    </div>
                    <div v-if="exercise.duration" class="detail-item">
                      <span class="detail-label">Duration:</span>
                      <span class="detail-value">{{ formatDuration(exercise.duration) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="modal-footer">
            <button class="btn btn-outline" @click="closeDetails">Close</button>
            <button class="btn btn-primary" @click="logWorkout(selectedPlan)">Log Workout</button>
          </div>
        </div>
      </div>
      
      <!-- Create/Edit Plan Modal -->
      <div v-if="showPlanModal" class="modal-overlay" @click.self="closePlanModal">
        <div class="modal-container">
          <div class="modal-header">
            <h2>{{ isEditing ? 'Edit Workout Plan' : 'Create Workout Plan' }}</h2>
            <button class="btn-close" @click="closePlanModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="modal-body">
            <form @submit.prevent="isEditing ? updatePlan() : createPlan()">
              <div class="form-group">
                <label for="planName">Plan Name</label>
                <input 
                  type="text" 
                  id="planName" 
                  v-model="planForm.name" 
                  class="form-control"
                  required
                >
              </div>
              
              <div class="form-group">
                <label for="planDescription">Description</label>
                <textarea 
                  id="planDescription" 
                  v-model="planForm.description" 
                  class="form-control"
                  rows="3"
                ></textarea>
              </div>
              
              <div class="form-actions">
                <button type="button" class="btn btn-outline" @click="closePlanModal">Cancel</button>
                <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                  <span v-if="isSubmitting">Saving...</span>
                  <span v-else>{{ isEditing ? 'Update Plan' : 'Create Plan' }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      <!-- Create/Edit Exercise Modal -->
      <div v-if="showExerciseModal" class="modal-overlay" @click.self="closeExerciseModal">
        <div class="modal-container">
          <div class="modal-header">
            <h2>{{ isEditingExercise ? 'Edit Exercise' : 'Add Exercise' }}</h2>
            <button class="btn-close" @click="closeExerciseModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="modal-body">
            <form @submit.prevent="isEditingExercise ? updateExercise() : addExercise()">
              <div class="form-group">
                <label for="exerciseName">Exercise Name</label>
                <input 
                  type="text" 
                  id="exerciseName" 
                  v-model="exerciseForm.name" 
                  class="form-control"
                  required
                >
              </div>
              
              <div class="form-group">
                <label for="exerciseDescription">Description</label>
                <textarea 
                  id="exerciseDescription" 
                  v-model="exerciseForm.description" 
                  class="form-control"
                  rows="2"
                ></textarea>
              </div>
              
              <div class="form-row">
                <div class="form-group half-width">
                  <label for="exerciseSets">Sets</label>
                  <input 
                    type="number" 
                    id="exerciseSets" 
                    v-model="exerciseForm.sets" 
                    class="form-control"
                    min="1"
                    required
                  >
                </div>
                
                <div class="form-group half-width">
                  <label for="exerciseReps">Reps</label>
                  <input 
                    type="number" 
                    id="exerciseReps" 
                    v-model="exerciseForm.reps" 
                    class="form-control"
                    min="1"
                    required
                  >
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-group half-width">
                  <label for="exerciseWeight">Weight (kg)</label>
                  <input 
                    type="number" 
                    id="exerciseWeight" 
                    v-model="exerciseForm.weight" 
                    class="form-control"
                    step="0.5"
                    min="0"
                  >
                </div>
                
                <div class="form-group half-width">
                  <label for="exerciseDuration">Duration (minutes)</label>
                  <input 
                    type="number" 
                    id="exerciseDuration" 
                    v-model="exerciseForm.durationMinutes" 
                    class="form-control"
                    min="0"
                  >
                </div>
              </div>
              
              <div class="form-actions">
                <button type="button" class="btn btn-outline" @click="closeExerciseModal">Cancel</button>
                <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                  <span v-if="isSubmitting">Saving...</span>
                  <span v-else>{{ isEditingExercise ? 'Update Exercise' : 'Add Exercise' }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import ApiService from '../services/ApiService';

export default {
  name: 'WorkoutPlans',
  data() {
    return {
      loading: true,
      isSubmitting: false,
      selectedPlan: null,
      showPlanModal: false,
      isEditing: false,
      planForm: {
        id: null,
        name: '',
        description: ''
      },
      showExerciseModal: false,
      isEditingExercise: false,
      exerciseForm: {
        id: null,
        name: '',
        description: '',
        sets: 3,
        reps: 10,
        weight: null,
        durationMinutes: null
      }
    };
  },
  computed: {
    ...mapState(['workoutPlans'])
  },
  methods: {
    async fetchData() {
      this.loading = true;
      try {
        await this.$store.dispatch('fetchWorkoutPlans');
      } catch (error) {
        console.error('Error fetching workout plans:', error);
      } finally {
        this.loading = false;
      }
    },
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      
      // If it's less than a day old, show relative time
      const diff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diff === 0) return 'Today';
      if (diff === 1) return 'Yesterday';
      
      return date.toLocaleDateString();
    },
    formatDuration(durationString) {
      if (!durationString) return '';
      const minutes = typeof durationString === 'string' 
        ? durationString.match(/PT(?:(\d+)H)?(?:(\d+)M)?/) 
        : null;
        
      if (minutes) {
        const hours = minutes[1] ? parseInt(minutes[1]) : 0;
        const mins = minutes[2] ? parseInt(minutes[2]) : 0;
        
        if (hours > 0) {
          return `${hours}h ${mins}m`;
        } else {
          return `${mins} min`;
        }
      } else {
        return '';
      }
    },
    viewPlan(plan) {
      this.selectedPlan = { ...plan };
    },
    closeDetails() {
      this.selectedPlan = null;
    },
    openCreateModal() {
      this.isEditing = false;
      this.planForm = {
        id: null,
        name: '',
        description: ''
      };
      this.showPlanModal = true;
    },
    openEditModal(plan) {
      this.isEditing = true;
      this.planForm = {
        id: plan.id,
        name: plan.name,
        description: plan.description
      };
      this.showPlanModal = true;
    },
    closePlanModal() {
      this.showPlanModal = false;
      this.planForm = {
        id: null,
        name: '',
        description: ''
      };
    },
    async createPlan() {
      this.isSubmitting = true;
      
      try {
        // Use the store action with properly capitalized property names
        const newPlan = await this.$store.dispatch('createWorkoutPlan', {
          Name: this.planForm.name,
          Description: this.planForm.description
        });
        
        this.closePlanModal();
        
        // Show success message
        this.$store.dispatch('showMessage', {
          message: 'Workout plan created successfully!',
          type: 'success'
        });
      } catch (error) {
        console.error('Error creating workout plan:', error);
        // Show error message
        this.$store.dispatch('showMessage', {
          message: 'Failed to create workout plan. Please try again.',
          type: 'error'
        });
      } finally {
        this.isSubmitting = false;
      }
    },
    async updatePlan() {
      this.isSubmitting = true;
      
      try {
        // Use the store action with properly capitalized property names
        await this.$store.dispatch('updateWorkoutPlan', {
          Id: this.planForm.id,
          Name: this.planForm.name,
          Description: this.planForm.description
        });
        
        this.closePlanModal();
        
        // If the selected plan was updated, update it too
        if (this.selectedPlan && this.selectedPlan.id === this.planForm.id) {
          this.selectedPlan.name = this.planForm.name;
          this.selectedPlan.description = this.planForm.description;
        }
        
        // Show success message
        this.$store.dispatch('showMessage', {
          message: 'Workout plan updated successfully!',
          type: 'success'
        });
      } catch (error) {
        console.error('Error updating workout plan:', error);
        // Show error message
        this.$store.dispatch('showMessage', {
          message: 'Failed to update workout plan. Please try again.',
          type: 'error'
        });
      } finally {
        this.isSubmitting = false;
      }
    },
    confirmDeletePlan(plan) {
      if (confirm(`Are you sure you want to delete the workout plan "${plan.name}"? This action cannot be undone.`)) {
        this.deletePlan(plan.id);
      }
    },
    async deletePlan(planId) {
      try {
        // Use the store action instead of direct fetch
        await this.$store.dispatch('deleteWorkoutPlan', planId);
        
        // If the selected plan was deleted, close it
        if (this.selectedPlan && this.selectedPlan.id === planId) {
          this.selectedPlan = null;
        }
        
        // Show success message
        this.$store.dispatch('showMessage', {
          message: 'Workout plan deleted successfully!',
          type: 'success'
        });
      } catch (error) {
        console.error('Error deleting workout plan:', error);
        // Show error message
        this.$store.dispatch('showMessage', {
          message: 'Failed to delete workout plan. Please try again.',
          type: 'error'
        });
      }
    },
    openAddExerciseModal() {
      this.isEditingExercise = false;
      this.exerciseForm = {
        id: null,
        name: '',
        description: '',
        sets: 3,
        reps: 10,
        weight: null,
        durationMinutes: null
      };
      this.showExerciseModal = true;
    },
    openEditExerciseModal(exercise) {
      this.isEditingExercise = true;
      
      // Convert the ISO duration to minutes for editing
      let durationMinutes = null;
      if (exercise.duration) {
        const minutes = exercise.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
        if (minutes) {
          const hours = minutes[1] ? parseInt(minutes[1]) : 0;
          const mins = minutes[2] ? parseInt(minutes[2]) : 0;
          durationMinutes = hours * 60 + mins;
        }
      }
      
      this.exerciseForm = {
        id: exercise.id,
        name: exercise.name,
        description: exercise.description,
        sets: exercise.sets,
        reps: exercise.reps,
        weight: exercise.weight,
        durationMinutes: durationMinutes
      };
      this.showExerciseModal = true;
    },
    closeExerciseModal() {
      this.showExerciseModal = false;
    },
    async addExercise() {
      this.isSubmitting = true;
      
      try {
        // Format the duration as ISO 8601 duration
        let duration = null;
        if (this.exerciseForm.durationMinutes) {
          const hours = Math.floor(this.exerciseForm.durationMinutes / 60);
          const minutes = this.exerciseForm.durationMinutes % 60;
          
          duration = 'PT';
          if (hours > 0) duration += `${hours}H`;
          if (minutes > 0) duration += `${minutes}M`;
          if (duration === 'PT') duration = null;
        }
        
        const exerciseData = {
          Name: this.exerciseForm.name,
          Description: this.exerciseForm.description,
          WorkoutPlanId: this.selectedPlan.id,
          Sets: this.exerciseForm.sets,
          Reps: this.exerciseForm.reps,
          Weight: this.exerciseForm.weight,
          Duration: duration
        };
        
        // Use ApiService instead of direct fetch
        const newExercise = await ApiService.post('Exercises', exerciseData);
        
        // Refresh the workout plans to get the updated exercises
        await this.fetchData();
        
        // Refresh the selected plan
        const updatedPlan = this.workoutPlans.find(p => p.id === this.selectedPlan.id);
        if (updatedPlan) {
          this.selectedPlan = { ...updatedPlan };
        }
        
        this.closeExerciseModal();
        
        // Show success message
        this.$store.dispatch('showMessage', {
          message: 'Exercise added successfully!',
          type: 'success'
        });
      } catch (error) {
        console.error('Error adding exercise:', error);
        // Show error message
        this.$store.dispatch('showMessage', {
          message: 'Failed to add exercise. Please try again.',
          type: 'error'
        });
      } finally {
        this.isSubmitting = false;
      }
    },
    async updateExercise() {
      this.isSubmitting = true;
      
      try {
        // Format the duration as ISO 8601 duration
        let duration = null;
        if (this.exerciseForm.durationMinutes) {
          const hours = Math.floor(this.exerciseForm.durationMinutes / 60);
          const minutes = this.exerciseForm.durationMinutes % 60;
          
          duration = 'PT';
          if (hours > 0) duration += `${hours}H`;
          if (minutes > 0) duration += `${minutes}M`;
          if (duration === 'PT') duration = null;
        }
        
        const exerciseData = {
          Id: this.exerciseForm.id,
          Name: this.exerciseForm.name,
          Description: this.exerciseForm.description,
          WorkoutPlanId: this.selectedPlan.id,
          Sets: this.exerciseForm.sets,
          Reps: this.exerciseForm.reps,
          Weight: this.exerciseForm.weight,
          Duration: duration
        };
        
        // Use ApiService instead of direct fetch
        await ApiService.put(`Exercises/${this.exerciseForm.id}`, exerciseData);
        
        // Refresh the workout plans to get the updated exercises
        await this.fetchData();
        
        // Refresh the selected plan
        const updatedPlan = this.workoutPlans.find(p => p.id === this.selectedPlan.id);
        if (updatedPlan) {
          this.selectedPlan = { ...updatedPlan };
        }
        
        this.closeExerciseModal();
        
        // Show success message
        this.$store.dispatch('showMessage', {
          message: 'Exercise updated successfully!',
          type: 'success'
        });
      } catch (error) {
        console.error('Error updating exercise:', error);
        // Show error message
        this.$store.dispatch('showMessage', {
          message: 'Failed to update exercise. Please try again.',
          type: 'error'
        });
      } finally {
        this.isSubmitting = false;
      }
    },
    confirmDeleteExercise(exercise) {
      if (confirm(`Are you sure you want to delete the exercise "${exercise.name}"? This action cannot be undone.`)) {
        this.deleteExercise(exercise.id);
      }
    },
    async deleteExercise(exerciseId) {
      try {
        // Use ApiService instead of direct fetch
        await ApiService.delete(`Exercises/${exerciseId}`);
        
        // Refresh the workout plans to get the updated exercises
        await this.fetchData();
        
        // Refresh the selected plan
        const updatedPlan = this.workoutPlans.find(p => p.id === this.selectedPlan.id);
        if (updatedPlan) {
          this.selectedPlan = { ...updatedPlan };
        }
        
        // Show success message
        this.$store.dispatch('showMessage', {
          message: 'Exercise deleted successfully!',
          type: 'success'
        });
      } catch (error) {
        console.error('Error deleting exercise:', error);
        // Show error message
        this.$store.dispatch('showMessage', {
          message: 'Failed to delete exercise. Please try again.',
          type: 'error'
        });
      }
    },
    logWorkout(plan) {
      // Redirect to workout logs page with the plan pre-selected
      this.$router.push({ 
        path: '/workout-logs', 
        query: { plan: plan.id } 
      });
    },
    getPlanName(plan) {
      return plan.Name || plan.name || 'Unnamed Plan';
    },
    getPlanDescription(plan) {
      return plan.Description || plan.description || '';
    }
  },
  mounted() {
    this.fetchData();
  }
};
</script>

<style scoped>
.workout-plans {
  padding: 1rem 0;
}

.page-title {
  font-size: 2rem;
  margin-bottom: 1.5rem;
  color: var(--dark-color);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.actions {
  margin-bottom: 2rem;
  display: flex;
  justify-content: flex-end;
}

.no-data {
  background-color: #f9f9f9;
  padding: 3rem;
  text-align: center;
  border-radius: 10px;
  margin-bottom: 2rem;
}

.no-data p {
  margin-bottom: 1rem;
  color: #666;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

.plan-card {
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.plan-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.plan-header {
  padding: 1.5rem;
  background-color: var(--primary-color);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.plan-header h2 {
  font-size: 1.4rem;
  margin: 0;
  flex: 1;
}

.plan-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  background: transparent;
  border: none;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
}

.btn-icon:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.plan-description {
  padding: 1.5rem;
  flex-grow: 1;
  color: #666;
  font-size: 0.95rem;
}

.plan-stats {
  padding: 0 1.5rem;
  display: flex;
  gap: 1.5rem;
  font-size: 0.9rem;
  color: #666;
}

.plan-stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.plan-footer {
  padding: 1.5rem;
  border-top: 1px solid #eee;
  text-align: center;
}

.btn-outline {
  color: var(--primary-color);
  background-color: transparent;
  border: 1px solid var(--primary-color);
  padding: 0.5rem 1rem;
}

.btn-outline:hover {
  background-color: var(--primary-color);
  color: white;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background-color: white;
  border-radius: 10px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--dark-color);
}

.btn-close {
  background: transparent;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #666;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
}

.btn-close:hover {
  background-color: #f1f1f1;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

/* Plan Details Modal Styles */
.plan-detail-description {
  margin-bottom: 2rem;
}

.plan-detail-description h3, .exercises-section h3 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: var(--dark-color);
}

.exercises-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.btn-sm {
  padding: 0.4rem 0.8rem;
  font-size: 0.9rem;
}

.no-exercises {
  background-color: #f9f9f9;
  padding: 2rem;
  text-align: center;
  border-radius: 8px;
}

.exercises-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.exercise-item {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 1.5rem;
}

.exercise-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.exercise-header h4 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--dark-color);
}

.exercise-actions .btn-icon {
  color: #666;
}

.exercise-actions .btn-icon:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.exercise-description {
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: #666;
}

.exercise-details {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.detail-item {
  background-color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.detail-label {
  font-weight: 500;
  color: #666;
}

.detail-value {
  font-weight: 600;
  color: var(--dark-color);
}

/* Form Styles */
.form-group {
  margin-bottom: 1.5rem;
}

.form-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.half-width {
  flex: 1;
  margin-bottom: 0;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--dark-color);
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-control:focus {
  border-color: var(--primary-color);
  outline: none;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

@media (max-width: 768px) {
  .plans-grid {
    grid-template-columns: 1fr;
  }
  
  .plan-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .plan-actions {
    align-self: flex-end;
  }
  
  .form-row {
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .modal-container {
    width: 95%;
    max-height: 95vh;
  }
}
</style> 