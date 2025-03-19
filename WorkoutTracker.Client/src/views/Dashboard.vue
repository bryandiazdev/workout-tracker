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
      
      <div class="chart-grid">
        <div class="chart-card">
          <h3 class="chart-title">Workout Frequency</h3>
          <div class="chart-container">
            <canvas ref="frequencyChart"></canvas>
          </div>
        </div>
        
        <div class="chart-card">
          <h3 class="chart-title">Workout Duration</h3>
          <div class="chart-container">
            <canvas ref="durationChart"></canvas>
          </div>
        </div>
        
        <div class="chart-card">
          <h3 class="chart-title">Exercise Types</h3>
          <div class="chart-container">
            <canvas ref="exerciseTypesChart"></canvas>
          </div>
        </div>
        
        <div class="chart-card">
          <h3 class="chart-title">Muscle Groups</h3>
          <div class="chart-container">
            <canvas ref="muscleGroupsChart"></canvas>
          </div>
        </div>
      </div>
      
      <div class="goals-section">
        <h2 class="section-title">Your Goals</h2>
        <div v-if="!goals || !Array.isArray(goals) || goals.length === 0" class="no-data">
          <p>You haven't set any goals yet.</p>
          <router-link to="/goals" class="btn btn-primary">Set Your First Goal</router-link>
        </div>
        <div v-else class="goals-list">
          <div v-for="goal in goalsArray.slice(0, 3)" :key="goal.id" class="goal-card">
            <div class="goal-info">
              <h3>{{ goal.name }}</h3>
              <p class="goal-target">{{ goal.targetValue }} {{ goal.unit }}</p>
              <p class="goal-dates">
                From {{ formatDate(goal.startDate) }} to {{ formatDate(goal.targetDate) }}
              </p>
              <div class="goal-progress">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: goal.isCompleted ? '100%' : '0%' }"></div>
                </div>
                <p class="progress-text">{{ goal.isCompleted ? 'Completed!' : 'In Progress' }}</p>
              </div>
            </div>
          </div>
          <div class="view-all">
            <router-link to="/goals" class="btn btn-outline">View All Goals</router-link>
          </div>
        </div>
      </div>
      
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
import Chart from 'chart.js/auto';
import { Chart as ChartJS, registerables } from 'chart.js';
import AuthService from '../services/AuthService';

// Register all the Chart.js components we'll need
ChartJS.register(...registerables);

// Use this to prevent chart updates after component is unmounted
let isComponentMounted = false;

export default {
  name: 'Dashboard',
  data() {
    return {
      loading: true,
      frequencyChart: null,
      durationChart: null,
      exerciseTypesChart: null,
      muscleGroupsChart: null,
      resizeTimeout: null,
      chartInstances: []  // Track all chart instances for proper cleanup
    };
  },
  computed: {
    ...mapState(['workoutLogs', 'workoutPlans', 'goals', 'stats', 'user']),
    goalsArray() {
      return Array.isArray(this.goals) ? this.goals : [];
    },
    workoutLogsArray() {
      return Array.isArray(this.workoutLogs) ? this.workoutLogs : [];
    }
  },
  methods: {
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString();
    },
    formatDuration(duration) {
      if (!duration) return '0 min';
      // Parse ISO duration like PT1H30M or directly use minutes if available
      const minutes = typeof duration === 'string' 
        ? duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/) 
        : null;
        
      if (minutes) {
        const hours = minutes[1] ? parseInt(minutes[1]) : 0;
        const mins = minutes[2] ? parseInt(minutes[2]) : 0;
        
        if (hours > 0) {
          return `${hours}h ${mins}m`;
        } else {
          return `${mins} min`;
        }
      } else if (typeof duration === 'number') {
        return `${duration} min`;
      } else {
        return '0 min';
      }
    },
    async fetchData() {
      if (!isComponentMounted) return; // Skip if component is unmounted
      
      this.loading = true;
      
      try {
        // Fetch all required data
        await Promise.all([
          this.$store.dispatch('fetchUser'),
          this.$store.dispatch('fetchWorkoutLogs'),
          this.$store.dispatch('fetchGoals'),
          this.$store.dispatch('fetchStats')
        ]);
        
        // Check if still mounted before continuing
        if (!isComponentMounted) return;
        
        // Fetch chart data
        await this.fetchChartData();
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        if (isComponentMounted) { // Only update loading state if still mounted
          this.loading = false;
        }
      }
    },
    async fetchChartData() {
      if (!isComponentMounted) return; // Skip if component is unmounted
      
      try {
        // Use ApiService instead of fetch for consistent handling and mock data support
        const frequencyData = await this.$store.dispatch('fetchChartData', 'workout-frequency');
        const durationData = await this.$store.dispatch('fetchChartData', 'workout-duration');
        const exerciseTypesData = await this.$store.dispatch('fetchChartData', 'exercise-types');
        const muscleGroupsData = await this.$store.dispatch('fetchChartData', 'muscle-groups');
        
        // Check if still mounted before continuing
        if (!isComponentMounted) return;
        
        // Render charts if data is available
        if (frequencyData && Object.keys(frequencyData).length > 0) {
          this.renderFrequencyChart(frequencyData);
        } else {
          console.warn('No workout frequency data available');
          // Display demo data if no real data
          this.renderFrequencyChart(this.getDemoFrequencyData());
        }
        
        if (!isComponentMounted) return; // Check again before continuing
        
        if (durationData && Object.keys(durationData).length > 0) {
          this.renderDurationChart(durationData);
        } else {
          console.warn('No workout duration data available');
          this.renderDurationChart(this.getDemoDurationData());
        }
        
        if (!isComponentMounted) return; // Check again before continuing
        
        if (exerciseTypesData && Object.keys(exerciseTypesData).length > 0) {
          this.renderExerciseTypesChart(exerciseTypesData);
        } else {
          console.warn('No exercise types data available');
          this.renderExerciseTypesChart(this.getDemoExerciseTypesData());
        }
        
        if (!isComponentMounted) return; // Check again before continuing
        
        if (muscleGroupsData && Object.keys(muscleGroupsData).length > 0) {
          this.renderMuscleGroupsChart(muscleGroupsData);
        } else {
          console.warn('No muscle groups data available');
          this.renderMuscleGroupsChart(this.getDemoMuscleGroupsData());
        }
      } catch (error) {
        if (!isComponentMounted) return; // Skip if component is unmounted
        
        console.error('Error fetching chart data:', error);
        // Display demo data on error
        this.renderFrequencyChart(this.getDemoFrequencyData());
        this.renderDurationChart(this.getDemoDurationData());
        this.renderExerciseTypesChart(this.getDemoExerciseTypesData());
        this.renderMuscleGroupsChart(this.getDemoMuscleGroupsData());
      }
    },
    // Demo data methods
    getDemoFrequencyData() {
      const data = {};
      const today = new Date();
      
      // Create 30 days of demo data
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Simulate workout patterns (more on weekdays, fewer on weekends)
        const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
        if ([1, 3, 5].includes(dayOfWeek)) { // Mon, Wed, Fri
          data[dateStr] = Math.random() > 0.2 ? 1 : 0;
        } else if ([2, 4].includes(dayOfWeek)) { // Tue, Thu
          data[dateStr] = Math.random() > 0.5 ? 1 : 0;
        } else { // Weekends
          data[dateStr] = Math.random() > 0.7 ? 1 : 0;
        }
        
        // Occasionally have 2 workouts in a day
        if (data[dateStr] === 1 && Math.random() > 0.9) {
          data[dateStr] = 2;
        }
      }
      
      return data;
    },
    getDemoDurationData() {
      const data = {};
      const today = new Date();
      const frequencyData = this.getDemoFrequencyData();
      
      // Create matching duration data for the frequency data
      Object.keys(frequencyData).forEach(dateStr => {
        if (frequencyData[dateStr] > 0) {
          // Generate realistic durations between 30 and 90 minutes
          const date = new Date(dateStr);
          const dayOfWeek = date.getDay();
          
          if ([1, 5].includes(dayOfWeek)) {
            // Monday and Friday - typically strength (45-75 min)
            data[dateStr] = Math.floor(Math.random() * 31) + 45;
          } else if ([3].includes(dayOfWeek)) {
            // Wednesday - typically longer sessions (60-90 min)
            data[dateStr] = Math.floor(Math.random() * 31) + 60;
          } else if ([2, 4].includes(dayOfWeek)) {
            // Tuesday, Thursday - typically cardio (30-60 min)
            data[dateStr] = Math.floor(Math.random() * 31) + 30;
          } else {
            // Weekends - variable (30-90 min)
            data[dateStr] = Math.floor(Math.random() * 61) + 30;
          }
          
          // For days with 2 workouts, increase duration
          if (frequencyData[dateStr] === 2) {
            data[dateStr] = Math.round(data[dateStr] * 1.5);
          }
        } else {
          data[dateStr] = 0;
        }
      });
      
      return data;
    },
    getDemoExerciseTypesData() {
      return {
        'Strength Training': 42,
        'Cardio': 35,
        'Flexibility': 15,
        'HIIT': 8
      };
    },
    getDemoMuscleGroupsData() {
      return {
        'Chest': 22,
        'Back': 25,
        'Legs': 30,
        'Arms': 18,
        'Shoulders': 15,
        'Core': 20
      };
    },
    renderFrequencyChart(data) {
      // Don't render if component is unmounted
      if (!isComponentMounted) {
        console.log('Skipping frequency chart render - component unmounted');
        return;
      }
      
      // Safely destroy existing chart first
      if (this.frequencyChart) {
        try {
          this.frequencyChart.destroy();
          this.frequencyChart = null;
        } catch (error) {
          console.warn('Error destroying frequency chart:', error);
        }
      }
      
      // Ensure we have data in the right format
      let dates, counts;
      
      if (Array.isArray(data.dates) && Array.isArray(data.counts)) {
        // Data is already in the right format
        dates = data.dates;
        counts = data.counts;
      } else {
        // Convert object format to arrays
        dates = Object.keys(data);
        counts = Object.values(data);
      }
      
      // Only display last 14 days for better visualization
      const last14Days = dates.slice(-14);
      const last14Counts = counts.slice(-14);
      
      // Check if canvas exists
      if (!this.$refs.frequencyChart) {
        console.warn('Cannot render frequency chart: Canvas element not found');
        return;
      }
      
      try {
        // Make sure the canvas is visible and has dimensions
        const canvas = this.$refs.frequencyChart;
        if (!canvas) {
          console.warn('Frequency chart canvas not found');
          return;
        }
        
        if (canvas.offsetWidth === 0 || canvas.offsetHeight === 0) {
          console.warn('Frequency chart canvas has zero dimensions, deferring render');
          if (isComponentMounted) {
            // Only retry if component is still mounted
            setTimeout(() => this.renderFrequencyChart(data), 250);
          }
          return;
        }
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.warn('Cannot get 2D context for frequency chart');
          return;
        }
        
        this.frequencyChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: last14Days.map(date => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
            datasets: [{
              label: 'Workouts',
              data: last14Counts,
              backgroundColor: 'rgba(54, 162, 235, 0.6)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                enabled: true
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  precision: 0
                }
              }
            }
          }
        });
        
        // Add to chart instances array for cleanup
        this.chartInstances.push(this.frequencyChart);
      } catch (error) {
        console.error('Error rendering frequency chart:', error);
      }
    },
    renderDurationChart(data) {
      // Don't render if component is unmounted
      if (!isComponentMounted) {
        console.log('Skipping duration chart render - component unmounted');
        return;
      }
      
      // Safely destroy existing chart first
      if (this.durationChart) {
        try {
          this.durationChart.destroy();
          this.durationChart = null;
        } catch (error) {
          console.warn('Error destroying duration chart:', error);
        }
      }
      
      // Ensure we have data in the right format
      let dates, durations;
      
      if (Array.isArray(data.dates) && Array.isArray(data.durations)) {
        // Data is already in the right format
        dates = data.dates;
        durations = data.durations;
      } else {
        // Convert object format to arrays
        dates = Object.keys(data);
        durations = Object.values(data);
      }
      
      // Only display last 14 days for better visualization
      const last14Days = dates.slice(-14);
      const last14Durations = durations.slice(-14);
      
      // Check if canvas exists
      if (!this.$refs.durationChart) {
        console.warn('Cannot render duration chart: Canvas element not found');
        return;
      }
      
      try {
        // Make sure the canvas is visible and has dimensions
        const canvas = this.$refs.durationChart;
        if (!canvas) {
          console.warn('Duration chart canvas not found');
          return;
        }
        
        if (canvas.offsetWidth === 0 || canvas.offsetHeight === 0) {
          console.warn('Duration chart canvas has zero dimensions, deferring render');
          if (isComponentMounted) {
            // Only retry if component is still mounted
            setTimeout(() => this.renderDurationChart(data), 250);
          }
          return;
        }
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.warn('Cannot get 2D context for duration chart');
          return;
        }
        
        this.durationChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: last14Days.map(date => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
            datasets: [{
              label: 'Duration (minutes)',
              data: last14Durations,
              backgroundColor: 'rgba(46, 204, 113, 0.2)',
              borderColor: 'rgba(46, 204, 113, 1)',
              borderWidth: 2,
              tension: 0.2,
              fill: true
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                enabled: true
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Minutes'
                }
              }
            }
          }
        });
        
        // Add to chart instances array for cleanup
        this.chartInstances.push(this.durationChart);
      } catch (error) {
        console.error('Error rendering duration chart:', error);
      }
    },
    renderExerciseTypesChart(data) {
      // Don't render if component is unmounted
      if (!isComponentMounted) {
        console.log('Skipping exercise types chart render - component unmounted');
        return;
      }
      
      // Safely destroy existing chart first
      if (this.exerciseTypesChart) {
        try {
          this.exerciseTypesChart.destroy();
          this.exerciseTypesChart = null;
        } catch (error) {
          console.warn('Error destroying exercise types chart:', error);
        }
      }
      
      // Ensure we have data in the right format
      let labels, values;
      
      if (Array.isArray(data.labels) && Array.isArray(data.data)) {
        // Data is already in the right format
        labels = data.labels;
        values = data.data;
      } else {
        // Convert object format to arrays
        labels = Object.keys(data);
        values = Object.values(data);
      }
      
      // Check if canvas exists
      if (!this.$refs.exerciseTypesChart) {
        console.warn('Cannot render exercise types chart: Canvas element not found');
        return;
      }
      
      try {
        // Make sure the canvas is visible and has dimensions
        const canvas = this.$refs.exerciseTypesChart;
        if (!canvas) {
          console.warn('Exercise types chart canvas not found');
          return;
        }
        
        if (canvas.offsetWidth === 0 || canvas.offsetHeight === 0) {
          console.warn('Exercise types chart canvas has zero dimensions, deferring render');
          if (isComponentMounted) {
            // Only retry if component is still mounted
            setTimeout(() => this.renderExerciseTypesChart(data), 250);
          }
          return;
        }
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.warn('Cannot get 2D context for exercise types chart');
          return;
        }
        
        // Generate vibrant colors for the pie chart
        const backgroundColors = [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)'
        ];
        
        this.exerciseTypesChart = new Chart(ctx, {
          type: 'pie',
          data: {
            labels: labels,
            datasets: [{
              data: values,
              backgroundColor: backgroundColors.slice(0, labels.length),
              borderColor: 'rgba(255, 255, 255, 0.5)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'right',
                labels: {
                  boxWidth: 15,
                  padding: 15
                }
              },
              tooltip: {
                enabled: true
              }
            }
          }
        });
        
        // Add to chart instances array for cleanup
        this.chartInstances.push(this.exerciseTypesChart);
      } catch (error) {
        console.error('Error rendering exercise types chart:', error);
      }
    },
    renderMuscleGroupsChart(data) {
      // Don't render if component is unmounted
      if (!isComponentMounted) {
        console.log('Skipping muscle groups chart render - component unmounted');
        return;
      }
      
      // Safely destroy existing chart first
      if (this.muscleGroupsChart) {
        try {
          this.muscleGroupsChart.destroy();
          this.muscleGroupsChart = null;
        } catch (error) {
          console.warn('Error destroying muscle groups chart:', error);
        }
      }
      
      // Ensure we have data in the right format
      let labels, values;
      
      if (Array.isArray(data.labels) && Array.isArray(data.data)) {
        // Data is already in the right format
        labels = data.labels;
        values = data.data;
      } else {
        // Convert object format to arrays
        labels = Object.keys(data);
        values = Object.values(data);
      }
      
      // Check if canvas exists
      if (!this.$refs.muscleGroupsChart) {
        console.warn('Cannot render muscle groups chart: Canvas element not found');
        return;
      }
      
      try {
        // Make sure the canvas is visible and has dimensions
        const canvas = this.$refs.muscleGroupsChart;
        if (!canvas) {
          console.warn('Muscle groups chart canvas not found');
          return;
        }
        
        if (canvas.offsetWidth === 0 || canvas.offsetHeight === 0) {
          console.warn('Muscle groups chart canvas has zero dimensions, deferring render');
          if (isComponentMounted) {
            // Only retry if component is still mounted
            setTimeout(() => this.renderMuscleGroupsChart(data), 250);
          }
          return;
        }
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.warn('Cannot get 2D context for muscle groups chart');
          return;
        }
        
        this.muscleGroupsChart = new Chart(ctx, {
          type: 'radar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Focus Areas',
              data: values,
              backgroundColor: 'rgba(142, 68, 173, 0.3)',
              borderColor: 'rgba(142, 68, 173, 1)',
              borderWidth: 2,
              pointBackgroundColor: 'rgba(142, 68, 173, 1)',
              pointRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                enabled: true
              }
            },
            scales: {
              r: {
                beginAtZero: true,
                ticks: {
                  display: false
                }
              }
            }
          }
        });
        
        // Add to chart instances array for cleanup
        this.chartInstances.push(this.muscleGroupsChart);
      } catch (error) {
        console.error('Error rendering muscle groups chart:', error);
      }
    },
    cleanupCharts() {
      console.log('Cleaning up all charts');
      
      // Clean up all chart instances
      this.chartInstances.forEach(chart => {
        if (chart) {
          try {
            chart.destroy();
          } catch (e) {
            console.warn('Error destroying chart:', e);
          }
        }
      });
      
      // Clear chart instances
      this.chartInstances = [];
      
      // Reset individual chart references
      this.frequencyChart = null;
      this.durationChart = null;
      this.exerciseTypesChart = null;
      this.muscleGroupsChart = null;
    },
    handleResize() {
      // Skip if component is unmounted
      if (!isComponentMounted) {
        return;
      }
      
      // Debounce the resize to avoid too many renders
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
      }
      
      this.resizeTimeout = setTimeout(() => {
        // Only refresh if component is still mounted
        if (isComponentMounted) {
          this.refreshCharts();
        }
      }, 250);
    },
    refreshCharts() {
      // Skip if component is unmounted
      if (!isComponentMounted) {
        return;
      }
      
      // Get current chart data
      const currentData = {
        frequency: this.frequencyChart?.data,
        duration: this.durationChart?.data,
        exerciseTypes: this.exerciseTypesChart?.data,
        muscleGroups: this.muscleGroupsChart?.data
      };
      
      // Cleanup existing charts
      this.cleanupCharts();
      
      // Re-render with saved data
      if (currentData.frequency) {
        this.renderFrequencyChart({ 
          dates: currentData.frequency.labels, 
          counts: currentData.frequency.datasets[0].data 
        });
      }
      
      if (currentData.duration) {
        this.renderDurationChart({ 
          dates: currentData.duration.labels, 
          durations: currentData.duration.datasets[0].data 
        });
      }
      
      if (currentData.exerciseTypes) {
        this.renderExerciseTypesChart({ 
          labels: currentData.exerciseTypes.labels, 
          data: currentData.exerciseTypes.datasets[0].data 
        });
      }
      
      if (currentData.muscleGroups) {
        this.renderMuscleGroupsChart({ 
          labels: currentData.muscleGroups.labels, 
          data: currentData.muscleGroups.datasets[0].data 
        });
      }
    }
  },
  created() {
    // Pre-initialize chart data
    console.log('Dashboard component created');
  },
  
  beforeMount() {
    // Clear any previous state
    isComponentMounted = false;
    this.cleanupCharts();
  },
  
  mounted() {
    isComponentMounted = true;
    console.log('Dashboard component mounted, current auth state:', {
      isAuthenticated: AuthService.isAuthenticated(),
      hasToken: !!localStorage.getItem('auth_token'),
      hasUser: !!this.$store.state.user
    });
    
    // Ensure we have user data before loading dashboard data
    if (!this.$store.state.user && AuthService.isAuthenticated()) {
      console.log('User data missing but authenticated, loading user data first');
      this.$store.dispatch('fetchUser')
        .then(() => {
          if (isComponentMounted) { // Only proceed if still mounted
            console.log('User data loaded successfully, now fetching dashboard data');
            this.fetchData();
          }
        })
        .catch(error => {
          if (!isComponentMounted) return; // Skip if unmounted
          
          console.error('Failed to load user data in dashboard:', error);
          this.loading = false;
          
          // Render mock charts even if user data fails to load
          this.renderFrequencyChart(this.getDemoFrequencyData());
          this.renderDurationChart(this.getDemoDurationData());
          this.renderExerciseTypesChart(this.getDemoExerciseTypesData());
          this.renderMuscleGroupsChart(this.getDemoMuscleGroupsData());
        });
    } else {
      this.fetchData();
    }
    
    // Ensure charts are rendered properly after component is fully mounted
    this.$nextTick(() => {
      if (!isComponentMounted) return; // Skip if unmounted
      
      // Set a small delay to ensure DOM is fully ready for chart rendering
      setTimeout(() => {
        if (!isComponentMounted) return; // Skip if unmounted during timeout
        
        if (!this.frequencyChart && this.$refs.frequencyChart) {
          console.log('Rendering demo charts as fallback');
          this.renderFrequencyChart(this.getDemoFrequencyData());
          this.renderDurationChart(this.getDemoDurationData());
          this.renderExerciseTypesChart(this.getDemoExerciseTypesData());
          this.renderMuscleGroupsChart(this.getDemoMuscleGroupsData());
        }
      }, 500);
    });
    
    // Add resize event listener to handle responsive charts
    window.addEventListener('resize', this.handleResize);
  },
  beforeUnmount() {
    console.log('Dashboard component unmounting');
    isComponentMounted = false;
    
    // Remove event listener and cleanup charts before component is destroyed
    window.removeEventListener('resize', this.handleResize);
    this.cleanupCharts();
  },
  deactivated() {
    console.log('Dashboard component deactivated');
    isComponentMounted = false;
    this.cleanupCharts();
  }
};
</script>

<style scoped>
.dashboard {
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

.welcome-card {
  background-color: var(--primary-color);
  color: white;
  border-radius: 10px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.welcome-card h2 {
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.chart-card {
  background-color: white;
  padding: 1.5rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
}

.chart-title {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: var(--dark-color);
}

.chart-container {
  height: 250px;
  width: 100%;
  position: relative;
  flex-grow: 1;
  min-height: 250px;
}

.section-title {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: var(--dark-color);
}

.goals-section, .recent-workouts {
  margin-bottom: 2rem;
}

.no-data {
  background-color: #f9f9f9;
  padding: 2rem;
  text-align: center;
  border-radius: 10px;
  margin-bottom: 1rem;
}

.no-data p {
  margin-bottom: 1rem;
  color: #666;
}

.goals-list, .recent-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.goal-card, .workout-card {
  background-color: white;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.goal-card h3, .workout-card h3 {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  color: var(--dark-color);
}

.goal-target {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.goal-dates {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 1rem;
}

.goal-progress {
  margin-top: 1rem;
}

.progress-bar {
  height: 8px;
  background-color: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background-color: var(--success-color);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.9rem;
  color: #666;
  text-align: right;
}

.workout-date {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.workout-details p {
  margin-bottom: 0.3rem;
  font-size: 0.95rem;
}

.workout-notes {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
  font-size: 0.9rem;
  color: #666;
  font-style: italic;
}

.view-all {
  grid-column: 1 / -1;
  text-align: center;
  margin-top: 1rem;
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

@media (max-width: 768px) {
  .chart-grid {
    grid-template-columns: 1fr;
  }
  
  .chart-container {
    height: 200px;
  }
  
  .welcome-card h2 {
    font-size: 1.5rem;
  }
}
</style> 