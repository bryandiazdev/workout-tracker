<template>
  <div class="dashboard">
    <h1 class="page-title">Dashboard</h1>
    
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading your fitness data...</p>
    </div>
    
    <div v-else>
      <div class="welcome-card" v-if="user">
        <div class="welcome-content">
          <h2>Welcome back, {{ user.name }}!</h2>
          <p>Track your progress and stay motivated on your fitness journey.</p>
        </div>
      </div>
      
      <!-- Summary Cards -->
      <div class="metrics-section">
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-icon">
              <i class="fas fa-dumbbell"></i>
            </div>
            <div class="metric-content">
              <h3 class="metric-value">{{ workoutPlansArray.length }}</h3>
              <p class="metric-label">Workout Plans</p>
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-icon">
              <i class="fas fa-calendar-check"></i>
            </div>
            <div class="metric-content">
              <h3 class="metric-value">{{ workoutLogsArray.length }}</h3>
              <p class="metric-label">Workouts Logged</p>
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-icon">
              <i class="fas fa-bullseye"></i>
            </div>
            <div class="metric-content">
              <h3 class="metric-value">{{ goalsArray.length }}</h3>
              <p class="metric-label">Active Goals</p>
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-icon">
              <i class="fas fa-fire"></i>
            </div>
            <div class="metric-content">
              <h3 class="metric-value">{{ getTotalExercisesCount() }}</h3>
              <p class="metric-label">Total Exercises</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- AI Generated Summary -->
      <div class="summary-section">
        <h2 class="section-title"><i class="fas fa-chart-line"></i> Your Fitness Summary</h2>
        <div class="summary-card">
          <p v-if="goalsArray.length === 0 && workoutLogsArray.length === 0">
            Welcome to your fitness journey! Start by creating goals and logging workouts to see your progress tracked here.
          </p>
          <div v-else>
            <p>
              <span class="summary-highlight">{{ workoutLogsArray.length }}</span> workouts logged toward 
              <span class="summary-highlight">{{ goalsArray.length }}</span> fitness goals. 
              You have <span class="summary-highlight">{{ workoutPlansArray.length }}</span> workout plans to choose from.
            </p>
            <p v-if="workoutLogsArray.length > 0">
              {{ getActivitySummary() }}
            </p>
            <p v-if="goalsArray.length > 0">
              {{ getGoalsSummary() }}
            </p>
          </div>
        </div>
      </div>
      
      <!-- Workout Plans Section -->
      <div class="workout-plans-section">
        <h2 class="section-title">Your Workout Plans</h2>
        <div v-if="!workoutPlans || !Array.isArray(workoutPlans) || workoutPlans.length === 0" class="no-data">
          <p>You haven't created any workout plans yet.</p>
          <router-link to="/workout-plans" class="btn btn-primary">Create Your First Plan</router-link>
        </div>
        <div v-else class="plans-list">
          <div v-for="plan in workoutPlansArray.slice(0, 3)" :key="plan.id" class="plan-card">
            <div class="plan-info">
              <h3>{{ plan.name }}</h3>
              <p class="plan-description">{{ plan.description }}</p>
              <p class="plan-stats">
                <span><i class="fas fa-running"></i> {{ plan.exercises ? plan.exercises.length : 0 }} exercises</span>
              </p>
            </div>
            <div class="plan-actions">
              <router-link :to="`/workout-plans/${plan.id}`" class="btn btn-outline-sm">View</router-link>
            </div>
          </div>
          <div class="view-all">
            <router-link to="/workout-plans" class="btn btn-outline">View All Plans</router-link>
          </div>
        </div>
      </div>
      
      <!-- Goals Section -->
      <div class="goals-section">
        <h2 class="section-title">Your Goals</h2>
        <div v-if="!goals || !Array.isArray(goals) || goals.length === 0" class="no-data">
          <p>You haven't set any goals yet.</p>
          <router-link to="/goals" class="btn btn-primary">Set Your First Goal</router-link>
        </div>
        <div v-else class="goals-list">
          <div v-for="goal in goalsArray.slice(0, 3)" :key="goal.id" class="goal-card">
            <div class="goal-info">
              <h3>{{ getGoalName(goal) }}</h3>
              <p class="goal-target">{{ getGoalCurrentValue(goal) }} / {{ getGoalTargetValue(goal) }} {{ getGoalUnit(goal) }}</p>
              <p class="goal-dates">
                Until {{ formatDate(getGoalTargetDate(goal)) }}
              </p>
              <div class="goal-progress">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: getProgressPercentage(goal) + '%' }"></div>
                </div>
                <p class="progress-text">{{ isGoalCompleted(goal) ? 'Completed!' : Math.round(getProgressPercentage(goal)) + '% Complete' }}</p>
              </div>
            </div>
          </div>
          <div class="view-all">
            <router-link to="/goals" class="btn btn-outline">View All Goals</router-link>
          </div>
        </div>
      </div>
      
      <!-- Recent Workouts Section -->
      <div class="recent-workouts">
        <h2 class="section-title">Recent Workouts</h2>
        <div v-if="!workoutLogs || !Array.isArray(workoutLogs) || workoutLogs.length === 0" class="no-data">
          <p>You haven't logged any workouts yet.</p>
          <router-link to="/workout-logs" class="btn btn-primary">Log Your First Workout</router-link>
        </div>
        <div v-else class="recent-list">
          <div v-for="log in workoutLogsArray.slice(0, 3)" :key="log.id" class="workout-card">
            <div class="workout-date">{{ formatDate(log.workoutDate) }}</div>
            <div class="workout-details">
              <h3>{{ log.workoutPlan ? log.workoutPlan.name : 'Custom Workout' }}</h3>
              <p>Duration: {{ formatDuration(log.duration) }}</p>
              <p>Exercises: {{ log.exerciseLogs ? log.exerciseLogs.length : 0 }}</p>
            </div>
            <div class="workout-notes" v-if="log.notes">
              <p>{{ log.notes }}</p>
            </div>
          </div>
          <div class="view-all">
            <router-link to="/workout-logs" class="btn btn-outline">View All Workouts</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import AuthService from '../services/AuthService';

export default {
  name: 'Dashboard',
  data() {
    return {
      loading: true
    };
  },
  computed: {
    ...mapState(['workoutLogs', 'workoutPlans', 'goals', 'stats', 'user']),
    goalsArray() {
      return Array.isArray(this.goals) ? this.goals : [];
    },
    workoutLogsArray() {
      return Array.isArray(this.workoutLogs) ? this.workoutLogs : [];
    },
    workoutPlansArray() {
      return Array.isArray(this.workoutPlans) ? this.workoutPlans : [];
    }
  },
  methods: {
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
      });
    },
    formatDuration(duration) {
      if (!duration) return '0 min';
      // Parse ISO duration like PT1H30M or directly use minutes if available
      if (typeof duration === 'number') {
        return `${duration} min`;
      }
      
      const minutes = typeof duration === 'string' 
        ? duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/) 
        : null;
        
      if (minutes) {
        const hours = minutes[1] ? parseInt(minutes[1]) : 0;
        const mins = minutes[2] ? parseInt(minutes[2]) : 0;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;
      }
      
      return duration;
    },
    getTotalExercisesCount() {
      // Count exercises from workout logs
      const logExercises = this.workoutLogsArray.reduce((total, log) => {
        return total + (log.exerciseLogs ? log.exerciseLogs.length : 0);
      }, 0);
      
      // Count exercises from workout plans
      const planExercises = this.workoutPlansArray.reduce((total, plan) => {
        return total + (plan.exercises ? plan.exercises.length : 0);
      }, 0);
      
      return logExercises + planExercises;
    },
    getProgressPercentage(goal) {
      if (!goal) return 0;
      if (this.isGoalCompleted(goal)) return 100;
      
      const start = parseFloat(this.getGoalStartingValue(goal)) || 0;
      const current = parseFloat(this.getGoalCurrentValue(goal)) || 0;
      const target = parseFloat(this.getGoalTargetValue(goal)) || 1;
      
      // Calculate progress percentage
      let percentage = ((current - start) / (target - start)) * 100;
      
      // Ensure the percentage is between 0 and 100
      percentage = Math.max(0, Math.min(100, percentage));
      
      return percentage;
    },
    getActivitySummary() {
      // Sort logs by date, newest first
      const sortedLogs = [...this.workoutLogsArray].sort(
        (a, b) => new Date(b.workoutDate) - new Date(a.workoutDate)
      );
      
      // Get the most recent workout date
      let recentActivity = 'No recent activity.';
      if (sortedLogs.length > 0) {
        const lastWorkout = sortedLogs[0];
        const lastWorkoutDate = new Date(lastWorkout.workoutDate);
        const today = new Date();
        const diffDays = Math.floor((today - lastWorkoutDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
          recentActivity = `Your last workout was today.`;
        } else if (diffDays === 1) {
          recentActivity = `Your last workout was yesterday.`;
        } else {
          recentActivity = `Your last workout was ${diffDays} days ago.`;
        }
        
        // Add more context based on workout frequency
        if (sortedLogs.length >= 3) {
          const recentWorkouts = sortedLogs.slice(0, 3);
          const totalDuration = recentWorkouts.reduce((total, log) => {
            const duration = typeof log.duration === 'number' ? log.duration : 30; // default to 30 mins
            return total + duration;
          }, 0);
          
          recentActivity += ` In your last ${recentWorkouts.length} workouts, you've trained for approximately ${totalDuration} minutes.`;
        }
      }
      
      return recentActivity;
    },
    getGoalsSummary() {
      const completedGoals = this.goalsArray.filter(g => this.isGoalCompleted(g)).length;
      const inProgressGoals = this.goalsArray.length - completedGoals;
      
      let summary = `You have ${completedGoals} completed goal${completedGoals !== 1 ? 's' : ''} and ${inProgressGoals} in progress.`;
      
      // Find the goal closest to completion
      if (inProgressGoals > 0) {
        const inProgressGoalsList = this.goalsArray.filter(g => !this.isGoalCompleted(g));
        if (inProgressGoalsList.length > 0) {
          // Sort by progress percentage
          inProgressGoalsList.sort((a, b) => this.getProgressPercentage(b) - this.getProgressPercentage(a));
          
          const closestGoal = inProgressGoalsList[0];
          const progress = Math.round(this.getProgressPercentage(closestGoal));
          
          if (progress > 0) {
            summary += ` Your goal "${this.getGoalName(closestGoal)}" is ${progress}% complete!`;
          }
        }
      }
      
      return summary;
    },
    async loadDashboardData() {
      try {
        this.loading = true;
        
        // Check if user is authenticated
        if (!AuthService.isAuthenticated()) {
          console.log('User is not authenticated, redirecting to login');
          this.$router.push('/login');
          return;
        }
        
        // Fetch all the data needed for the dashboard
        await Promise.all([
          this.$store.dispatch('fetchWorkoutPlans'),
          this.$store.dispatch('fetchWorkoutLogs'),
          this.$store.dispatch('fetchGoals'),
          this.$store.dispatch('fetchStats')
        ]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        this.loading = false;
      }
    },
    // Helper methods to handle property name inconsistencies
    getGoalName(goal) {
      return goal.Name || goal.name || 'Unnamed Goal';
    },
    
    getGoalDescription(goal) {
      return goal.Description || goal.description || '';
    },
    
    getGoalUnit(goal) {
      return goal.Unit || goal.unit || '';
    },
    
    getGoalStartDate(goal) {
      return goal.StartDate || goal.startDate || '';
    },
    
    getGoalTargetDate(goal) {
      return goal.TargetDate || goal.targetDate || '';
    },
    
    getGoalStartingValue(goal) {
      return goal.StartingValue || goal.startingValue || 0;
    },
    
    getGoalCurrentValue(goal) {
      return goal.CurrentValue || goal.currentValue || 0;
    },
    
    getGoalTargetValue(goal) {
      return goal.TargetValue || goal.targetValue || 0;
    },
    
    isGoalCompleted(goal) {
      return goal.IsCompleted || goal.isCompleted || false;
    }
  },
  async created() {
    console.log('Dashboard component created');
  },
  async mounted() {
    console.log('Dashboard component mounted, current auth state:', {
      isAuthenticated: AuthService.isAuthenticated(),
      hasUser: !!this.user
    });
    
    // Load user data if authenticated but user data is missing
    if (AuthService.isAuthenticated() && !this.user) {
      console.log('User data missing but authenticated, loading user data first');
      await this.$store.dispatch('fetchUser');
      console.log('User data loaded successfully, now fetching dashboard data');
    }
    
    // Load dashboard data
    await this.loadDashboardData();
  }
};
</script>

<style scoped>
.dashboard {
  padding-bottom: 2rem;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #007bff;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.welcome-card {
  background: linear-gradient(135deg, #4a90e2, #007bff);
  color: white;
  border-radius: 10px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.welcome-content h2 {
  margin-top: 0;
  font-size: 1.8rem;
}

.welcome-content p {
  margin-bottom: 0;
  font-size: 1rem;
  opacity: 0.9;
}

/* Metrics Section */
.metrics-section {
  margin-bottom: 2rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.metric-card {
  background-color: white;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  transition: transform 0.2s, box-shadow 0.2s;
}

.metric-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.metric-icon {
  background-color: #f0f7ff;
  color: #007bff;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  font-size: 1.5rem;
}

.metric-content {
  flex: 1;
}

.metric-value {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
  color: #2c3e50;
}

.metric-label {
  color: #6c757d;
  margin: 0;
  font-size: 0.9rem;
}

/* Summary Section */
.summary-section {
  margin-bottom: 2rem;
}

.summary-card {
  background-color: white;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  line-height: 1.6;
}

.summary-highlight {
  color: #007bff;
  font-weight: 700;
}

.section-title {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-title i {
  color: #007bff;
}

/* Goals, Workout Plans, and Recent Workouts sections */
.goals-section,
.workout-plans-section,
.recent-workouts {
  margin-bottom: 2rem;
}

.no-data {
  background-color: #f8f9fa;
  border-radius: 10px;
  padding: 2rem;
  text-align: center;
  margin-bottom: 1rem;
}

.no-data p {
  margin-bottom: 1rem;
  color: #6c757d;
}

.goals-list,
.plans-list,
.recent-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.goal-card,
.plan-card,
.workout-card {
  background-color: white;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
}

.goal-card:hover,
.plan-card:hover,
.workout-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.goal-info h3,
.plan-info h3,
.workout-details h3 {
  margin-top: 0;
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.goal-target,
.goal-dates,
.plan-description,
.plan-stats,
.workout-date {
  color: #6c757d;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.goal-progress,
.progress-bar {
  height: 8px;
  background-color: #e9ecef;
  border-radius: 4px;
  margin: 0.5rem 0;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #007bff;
  border-radius: 4px;
}

.progress-text {
  font-size: 0.8rem;
  color: #6c757d;
  margin: 0;
}

.plan-actions {
  margin-top: 1rem;
}

.workout-date {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.workout-notes {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e9ecef;
  font-style: italic;
  color: #6c757d;
}

.view-all {
  grid-column: 1 / -1;
  text-align: center;
  margin-top: 1rem;
}

.btn {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  font-weight: 500;
  text-decoration: none;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #007bff;
  color: white;
  border: none;
}

.btn-primary:hover {
  background-color: #0069d9;
}

.btn-outline {
  background-color: transparent;
  color: #007bff;
  border: 1px solid #007bff;
}

.btn-outline:hover {
  background-color: #007bff;
  color: white;
}

.btn-outline-sm {
  background-color: transparent;
  color: #007bff;
  border: 1px solid #007bff;
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
}

.btn-outline-sm:hover {
  background-color: #007bff;
  color: white;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .metrics-grid,
  .goals-list,
  .plans-list,
  .recent-list {
    grid-template-columns: 1fr;
  }
}
</style> 