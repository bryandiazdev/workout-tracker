<template>
  <div class="profile-container">
    <h1 class="page-title">My Profile</h1>
    
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading your profile...</p>
    </div>
    
    <div v-else class="profile-content">
      <div class="profile-card">
        <div class="profile-header">
          <div class="profile-picture">
            <img v-if="userProfile.pictureUrl" :src="userProfile.pictureUrl" alt="Profile picture">
            <div v-else class="profile-placeholder">
              <i class="fas fa-user"></i>
            </div>
          </div>
          <div class="profile-info">
            <h2>{{ user.name }}</h2>
            <p class="profile-email">{{ user.email }}</p>
            <p class="profile-member">Member since {{ formatDate(user.createdAt) }}</p>
          </div>
        </div>
        
        <div class="profile-stats">
          <div class="stat-item">
            <div class="stat-value">{{ stats?.totalWorkouts || 0 }}</div>
            <div class="stat-label">Workouts</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ workoutPlans.length || 0 }}</div>
            <div class="stat-label">Workout Plans</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ goals.filter(g => g.isCompleted).length || 0 }}</div>
            <div class="stat-label">Goals Achieved</div>
          </div>
        </div>
      </div>
      
      <div class="tabs">
        <div 
          class="tab" 
          :class="{ 'active': activeTab === 'personal' }"
          @click="activeTab = 'personal'"
        >
          Personal Information
        </div>
        <div 
          class="tab" 
          :class="{ 'active': activeTab === 'fitness' }"
          @click="activeTab = 'fitness'"
        >
          Fitness Profile
        </div>
        <div 
          class="tab" 
          :class="{ 'active': activeTab === 'preferences' }"
          @click="activeTab = 'preferences'"
        >
          Preferences
        </div>
      </div>
      
      <div class="tab-content">
        <!-- Personal Information Tab -->
        <div v-if="activeTab === 'personal'" class="personal-info">
          <form @submit.prevent="updatePersonalInfo">
            <div class="form-group">
              <label for="firstName">First Name</label>
              <input 
                type="text" 
                id="firstName" 
                v-model="userProfile.firstName" 
                class="form-control"
              >
            </div>
            
            <div class="form-group">
              <label for="lastName">Last Name</label>
              <input 
                type="text" 
                id="lastName" 
                v-model="userProfile.lastName" 
                class="form-control"
              >
            </div>
            
            <div class="form-group">
              <label for="birthdate">Date of Birth</label>
              <input 
                type="date" 
                id="birthdate" 
                v-model="userProfile.birthdate" 
                class="form-control"
              >
            </div>
            
            <div class="form-group">
              <label for="gender">Gender</label>
              <select id="gender" v-model="userProfile.gender" class="form-control">
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="phoneNumber">Phone Number</label>
              <input 
                type="tel" 
                id="phoneNumber" 
                v-model="userProfile.phoneNumber" 
                class="form-control"
              >
            </div>
            
            <div class="form-group">
              <label for="pictureUrl">Profile Picture URL</label>
              <input 
                type="url" 
                id="pictureUrl" 
                v-model="userProfile.pictureUrl" 
                class="form-control"
                placeholder="https://example.com/your-profile-picture.jpg"
              >
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="updating">
                <span v-if="updating">Saving...</span>
                <span v-else>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
        
        <!-- Fitness Profile Tab -->
        <div v-if="activeTab === 'fitness'" class="fitness-profile">
          <form @submit.prevent="updateFitnessProfile">
            <div class="form-row">
              <div class="form-group half-width">
                <label for="height">Height (cm)</label>
                <input 
                  type="number" 
                  id="height" 
                  v-model="userProfile.height" 
                  class="form-control"
                  step="0.1"
                  min="0"
                >
              </div>
              
              <div class="form-group half-width">
                <label for="weight">Weight (kg)</label>
                <input 
                  type="number" 
                  id="weight" 
                  v-model="userProfile.weight" 
                  class="form-control"
                  step="0.1"
                  min="0"
                >
              </div>
            </div>
            
            <div class="form-group">
              <label for="fitnessLevel">Fitness Level</label>
              <select id="fitnessLevel" v-model="userProfile.fitnessLevel" class="form-control">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="professional">Professional</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Fitness Goals (select multiple)</label>
              <div class="checkbox-group">
                <div class="checkbox-item">
                  <input 
                    type="checkbox" 
                    id="goalWeightLoss" 
                    v-model="userProfile.fitnessGoals.weightLoss"
                  >
                  <label for="goalWeightLoss">Weight Loss</label>
                </div>
                
                <div class="checkbox-item">
                  <input 
                    type="checkbox" 
                    id="goalMuscleGain" 
                    v-model="userProfile.fitnessGoals.muscleGain"
                  >
                  <label for="goalMuscleGain">Muscle Gain</label>
                </div>
                
                <div class="checkbox-item">
                  <input 
                    type="checkbox" 
                    id="goalEndurance" 
                    v-model="userProfile.fitnessGoals.endurance"
                  >
                  <label for="goalEndurance">Endurance</label>
                </div>
                
                <div class="checkbox-item">
                  <input 
                    type="checkbox" 
                    id="goalFlexibility" 
                    v-model="userProfile.fitnessGoals.flexibility"
                  >
                  <label for="goalFlexibility">Flexibility</label>
                </div>
                
                <div class="checkbox-item">
                  <input 
                    type="checkbox" 
                    id="goalStrength" 
                    v-model="userProfile.fitnessGoals.strength"
                  >
                  <label for="goalStrength">Strength</label>
                </div>
              </div>
            </div>
            
            <div class="form-group">
              <label for="medicalConditions">Medical Conditions</label>
              <textarea 
                id="medicalConditions" 
                v-model="userProfile.medicalConditions" 
                class="form-control"
                rows="3"
                placeholder="List any medical conditions or injuries that might affect your workouts (optional)"
              ></textarea>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="updating">
                <span v-if="updating">Saving...</span>
                <span v-else>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
        
        <!-- Preferences Tab -->
        <div v-if="activeTab === 'preferences'" class="preferences">
          <form @submit.prevent="updatePreferences">
            <div class="form-group">
              <label for="preferredWorkoutDays">Preferred Workout Days</label>
              <div class="checkbox-group days">
                <div 
                  v-for="(day, index) in daysOfWeek" 
                  :key="index" 
                  class="day-checkbox"
                >
                  <input 
                    type="checkbox" 
                    :id="'day-' + index" 
                    v-model="userProfile.preferences.workoutDays[index]"
                  >
                  <label :for="'day-' + index">{{ day }}</label>
                </div>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group half-width">
                <label for="workoutStartTime">Preferred Workout Start Time</label>
                <input 
                  type="time" 
                  id="workoutStartTime" 
                  v-model="userProfile.preferences.workoutStartTime" 
                  class="form-control"
                >
              </div>
              
              <div class="form-group half-width">
                <label for="workoutDuration">Average Workout Duration (minutes)</label>
                <input 
                  type="number" 
                  id="workoutDuration" 
                  v-model="userProfile.preferences.workoutDuration" 
                  class="form-control"
                  min="5"
                  step="5"
                >
              </div>
            </div>
            
            <div class="form-group">
              <label for="preferredWorkoutType">Preferred Workout Type</label>
              <select id="preferredWorkoutType" v-model="userProfile.preferences.workoutType" class="form-control">
                <option value="strength">Strength Training</option>
                <option value="cardio">Cardio</option>
                <option value="hiit">HIIT</option>
                <option value="yoga">Yoga</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="notifications">Notification Preferences</label>
              <div class="checkbox-group">
                <div class="checkbox-item">
                  <input 
                    type="checkbox" 
                    id="notifyReminders" 
                    v-model="userProfile.preferences.notifications.reminders"
                  >
                  <label for="notifyReminders">Workout Reminders</label>
                </div>
                
                <div class="checkbox-item">
                  <input 
                    type="checkbox" 
                    id="notifyProgress" 
                    v-model="userProfile.preferences.notifications.progress"
                  >
                  <label for="notifyProgress">Progress Updates</label>
                </div>
                
                <div class="checkbox-item">
                  <input 
                    type="checkbox" 
                    id="notifyTips" 
                    v-model="userProfile.preferences.notifications.tips"
                  >
                  <label for="notifyTips">Workout Tips</label>
                </div>
              </div>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="updating">
                <span v-if="updating">Saving...</span>
                <span v-else>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <div class="account-settings">
        <h2>Account Settings</h2>
        <div class="setting-actions">
          <button class="btn btn-outline" @click="resetPassword">
            Reset Password
          </button>
          <button class="btn btn-danger" @click="confirmDeleteAccount">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import AuthService from '@/services/AuthService';

export default {
  name: 'Profile',
  data() {
    return {
      loading: true,
      updating: false,
      activeTab: 'personal',
      userProfile: {
        firstName: '',
        lastName: '',
        birthdate: '',
        gender: '',
        phoneNumber: '',
        pictureUrl: '',
        height: null,
        weight: null,
        fitnessLevel: 'beginner',
        fitnessGoals: {
          weightLoss: false,
          muscleGain: false,
          endurance: false,
          flexibility: false,
          strength: false
        },
        medicalConditions: '',
        preferences: {
          workoutDays: [false, false, false, false, false, false, false],
          workoutStartTime: '18:00',
          workoutDuration: 45,
          workoutType: 'mixed',
          notifications: {
            reminders: true,
            progress: true,
            tips: false
          }
        }
      },
      daysOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    };
  },
  computed: {
    ...mapState(['user', 'workoutPlans', 'goals', 'stats'])
  },
  methods: {
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    },
    async fetchData() {
      this.loading = true;
      try {
        await Promise.all([
          this.$store.dispatch('fetchUser'),
          this.$store.dispatch('fetchWorkoutPlans'),
          this.$store.dispatch('fetchGoals'),
          this.$store.dispatch('fetchStats')
        ]);
        
        // Fetch user profile details from the API
        const response = await fetch('https://localhost:5001/api/Users/profile', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        
        if (response.ok) {
          const profileData = await response.json();
          this.mergeProfileData(profileData);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        this.loading = false;
      }
    },
    mergeProfileData(profileData) {
      // Fill the form with existing data from the API response
      if (profileData) {
        this.userProfile = {
          ...this.userProfile,
          ...profileData,
          fitnessGoals: {
            ...this.userProfile.fitnessGoals,
            ...(profileData.fitnessGoals || {})
          },
          preferences: {
            ...this.userProfile.preferences,
            ...(profileData.preferences || {}),
            notifications: {
              ...this.userProfile.preferences.notifications,
              ...(profileData.preferences?.notifications || {})
            }
          }
        };
      }
    },
    async updatePersonalInfo() {
      await this.saveProfile();
    },
    async updateFitnessProfile() {
      await this.saveProfile();
    },
    async updatePreferences() {
      await this.saveProfile();
    },
    async saveProfile() {
      this.updating = true;
      
      try {
        const response = await fetch('https://localhost:5001/api/Users/profile', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(this.userProfile)
        });
        
        if (response.ok) {
          this.$store.dispatch('showMessage', {
            message: 'Profile updated successfully',
            type: 'success'
          });
        } else {
          const error = await response.json();
          throw new Error(error.message || 'Failed to update profile');
        }
      } catch (error) {
        this.$store.dispatch('showMessage', {
          message: error.message || 'An error occurred while updating your profile',
          type: 'error'
        });
      } finally {
        this.updating = false;
      }
    },
    resetPassword() {
      const authService = new AuthService();
      authService.resetPassword(this.user.email)
        .then(() => {
          this.$store.dispatch('showMessage', {
            message: 'Password reset email sent',
            type: 'success'
          });
        })
        .catch(error => {
          this.$store.dispatch('showMessage', {
            message: error.message || 'Failed to send password reset email',
            type: 'error'
          });
        });
    },
    confirmDeleteAccount() {
      if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        this.deleteAccount();
      }
    },
    async deleteAccount() {
      try {
        const response = await fetch('https://localhost:5001/api/Users', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        
        if (response.ok) {
          // Log out the user
          const authService = new AuthService();
          await authService.logout();
          
          // Redirect to home page
          this.$router.push('/');
          
          this.$store.dispatch('showMessage', {
            message: 'Your account has been deleted successfully',
            type: 'success'
          });
        } else {
          const error = await response.json();
          throw new Error(error.message || 'Failed to delete account');
        }
      } catch (error) {
        this.$store.dispatch('showMessage', {
          message: error.message || 'An error occurred while deleting your account',
          type: 'error'
        });
      }
    }
  },
  mounted() {
    this.fetchData();
  }
};
</script>

<style scoped>
.profile-container {
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

.profile-card {
  background-color: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2rem;
}

.profile-picture {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-picture img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-placeholder {
  font-size: 3rem;
  color: #aaa;
}

.profile-info h2 {
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
  color: var(--dark-color);
}

.profile-email {
  color: #666;
  margin-bottom: 0.3rem;
}

.profile-member {
  font-size: 0.9rem;
  color: #888;
}

.profile-stats {
  display: flex;
  justify-content: space-around;
  border-top: 1px solid #eee;
  padding-top: 1.5rem;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: var(--primary-color);
  margin-bottom: 0.3rem;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
}

.tabs {
  display: flex;
  margin-bottom: 2rem;
  border-bottom: 1px solid #e0e0e0;
}

.tab {
  padding: 1rem 1.5rem;
  cursor: pointer;
  font-weight: 500;
  color: #666;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
}

.tab:hover {
  color: var(--primary-color);
}

.tab.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
}

.tab-content {
  background-color: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
}

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

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.days {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 0.5rem;
}

.form-actions {
  margin-top: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2980b9;
}

.btn-outline {
  background-color: transparent;
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
}

.btn-outline:hover {
  background-color: var(--primary-color);
  color: white;
}

.btn-danger {
  background-color: #e74c3c;
  color: white;
}

.btn-danger:hover {
  background-color: #c0392b;
}

.account-settings {
  background-color: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.account-settings h2 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: var(--dark-color);
}

.setting-actions {
  display: flex;
  gap: 1rem;
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .form-row {
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .tabs {
    flex-direction: column;
    border-bottom: none;
  }
  
  .tab {
    border-bottom: 1px solid #e0e0e0;
    border-left: 2px solid transparent;
    padding: 1rem;
  }
  
  .tab.active {
    border-bottom-color: #e0e0e0;
    border-left-color: var(--primary-color);
    background-color: #f9f9f9;
  }
  
  .setting-actions {
    flex-direction: column;
  }
}
</style> 