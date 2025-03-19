<template>
  <div class="app">
    <div id="auth-debug" v-if="showAuthDebug" class="auth-debug-panel">
      <h3>Auth Debug Info</h3>
      <p><strong>Authenticated:</strong> {{ isAuthenticated }}</p>
      <p><strong>Token:</strong> {{ hasToken ? 'Present' : 'None' }}</p>
      <p><strong>User:</strong> {{ hasUser ? 'Loaded' : 'None' }}</p>
      <button @click="closeDebugPanel">Close</button>
    </div>
    <header class="app-header">
      <div class="container">
        <div class="logo">
          <router-link to="/">
            <h1>WorkoutTracker</h1>
          </router-link>
        </div>
        <nav v-if="$store.state.isAuthenticated">
          <router-link to="/dashboard">Dashboard</router-link>
          <router-link to="/workout-plans">Workout Plans</router-link>
          <router-link to="/workout-logs">Workout Logs</router-link>
          <router-link to="/goals">Goals</router-link>
          <a href="#" @click.prevent="logout">Logout</a>
        </nav>
        <nav v-else>
          <router-link to="/login">Login</router-link>
        </nav>
      </div>
    </header>
    
    <main class="container">
      <transition name="fade" mode="out-in">
        <router-view />
      </transition>
    </main>
    
    <footer class="app-footer">
      <div class="container">
        <p>&copy; {{ currentYear }} WorkoutTracker. All rights reserved.</p>
      </div>
    </footer>
    
    <Notification />
  </div>
</template>

<script>
import { mapState } from 'vuex';
import AuthService from './services/AuthService';
import Notification from './components/Notification.vue';
import { onMounted, computed, ref } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default {
  name: 'App',
  components: {
    Notification
  },
  setup() {
    const store = useStore();
    const router = useRouter();
    const showAuthDebug = ref(false);
    
    const isAuthenticated = computed(() => AuthService.isAuthenticated());
    const hasToken = computed(() => !!AuthService.getToken());
    const hasUser = computed(() => !!store.state.user);
    
    const checkAndShowDebug = () => {
      // Only show debug panel if authentication is problematic
      if (hasToken.value && !hasUser.value) {
        showAuthDebug.value = true;
      }
    };
    
    const closeDebugPanel = () => {
      showAuthDebug.value = false;
    };
    
    onMounted(() => {
      console.log('App.vue mounted - checking authentication state');
      
      // Check for tokens in localStorage
      const token = localStorage.getItem('auth_token');
      const idToken = localStorage.getItem('id_token');
      const userProfile = localStorage.getItem('user_profile');
      
      console.log('Initial auth state:', {
        hasToken: !!token,
        hasIdToken: !!idToken,
        hasUserProfile: !!userProfile,
        isAuthenticated: AuthService.isAuthenticated(),
        hasUserInStore: !!store.state.user
      });
      
      // Initialize user data if authenticated but no user in store
      if (AuthService.isAuthenticated()) {
        console.log('User is authenticated, ensuring user data is loaded');
        
        // Update store isAuthenticated state
        store.commit('setAuthenticated', true);
        
        // If we have a profile in localStorage but not in store, use it
        if (userProfile && !store.state.user) {
          console.log('Loading user profile from localStorage to Vuex store');
          store.commit('setUser', JSON.parse(userProfile));
        } 
        // Otherwise fetch user data if we have a token but no profile
        else if (token && !userProfile) {
          console.log('Fetching user data from API');
          store.dispatch('fetchUser').catch(err => {
            console.error('Failed to fetch user data on app init:', err);
          });
        }
      } else {
        // Ensure unauthenticated state is reflected in the store
        store.commit('setAuthenticated', false);
      }
      
      // Set interval to check for auth inconsistencies
      setTimeout(checkAndShowDebug, 5000);
    });
    
    const logout = async () => {
      try {
        await store.dispatch('logout');
        router.push('/login');
      } catch (error) {
        // Check if this is an Auth0 returnTo URL configuration issue
        if (error && error.message && error.message.includes('returnTo')) {
          console.error('Auth0 logout error related to returnTo URL configuration:', error);
          // Redirect to auth configuration helper page
          router.push('/auth-config?error=invalid_request&error_description=' + encodeURIComponent(error.message));
        } else {
          console.error('Logout error:', error);
          // Show error notification
          store.dispatch('showMessage', {
            message: 'There was an issue during logout. Your session may not be fully cleared.',
            type: 'error'
          });
          // Redirect to login anyway
          router.push('/login');
        }
      }
    };
    
    return {
      isAuthenticated,
      hasToken,
      hasUser,
      showAuthDebug,
      closeDebugPanel,
      logout
    };
  },
  computed: {
    ...mapState(['user', 'isAuthenticated']),
    currentYear() {
      return new Date().getFullYear();
    }
  }
};
</script>

<style>
:root {
  --primary-color: #3498db;
  --secondary-color: #2ecc71;
  --dark-color: #2c3e50;
  --light-color: #ecf0f1;
  --danger-color: #e74c3c;
  --success-color: #27ae60;
  --warning-color: #f39c12;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Roboto', sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: #333;
  background-color: var(--light-color);
}

.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;
}

a {
  color: var(--primary-color);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  background-color: var(--dark-color);
  color: white;
  padding: 1rem 0;
}

.app-header .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo a {
  color: white;
  text-decoration: none;
}

.logo h1 {
  font-size: 1.8rem;
  margin: 0;
}

nav {
  display: flex;
  gap: 1.5rem;
}

nav a {
  color: white;
  text-decoration: none;
  padding: 0.5rem 0;
  position: relative;
}

nav a:hover {
  text-decoration: none;
}

nav a::after {
  content: '';
  position: absolute;
  width: 0;
  height: 2px;
  background-color: var(--secondary-color);
  bottom: 0;
  left: 0;
  transition: width 0.3s ease;
}

nav a:hover::after {
  width: 100%;
}

main {
  flex: 1;
  padding: 2rem 0;
}

.app-footer {
  background-color: var(--dark-color);
  color: white;
  padding: 1.5rem 0;
  text-align: center;
  margin-top: auto;
}

/* Form Styles */
.form-group {
  margin-bottom: 1.5rem;
}

.form-control {
  display: block;
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  line-height: 1.5;
  color: #495057;
  background-color: #fff;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-control:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 0.2rem rgba(52, 152, 219, 0.25);
  outline: none;
}

.btn {
  display: inline-block;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
  user-select: none;
  border: 1px solid transparent;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  line-height: 1.5;
  border-radius: 0.25rem;
  transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  cursor: pointer;
}

.btn-primary {
  color: #fff;
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

.btn-primary:hover {
  background-color: #2980b9;
  border-color: #2980b9;
}

.btn-success {
  color: #fff;
  background-color: var(--success-color);
  border-color: var(--success-color);
}

.btn-success:hover {
  background-color: #219653;
  border-color: #219653;
}

.btn-danger {
  color: #fff;
  background-color: var(--danger-color);
  border-color: var(--danger-color);
}

.btn-danger:hover {
  background-color: #c0392b;
  border-color: #c0392b;
}

/* Card Styles */
.card {
  background-color: #fff;
  border-radius: 0.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
  overflow: hidden;
}

.card-header {
  padding: 1.25rem 1.5rem;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.card-body {
  padding: 1.5rem;
}

.card-title {
  margin-bottom: 1rem;
  color: var(--dark-color);
}

/* Alert Styles */
.alert {
  padding: 1rem;
  margin-bottom: 1.5rem;
  border-radius: 0.25rem;
}

.alert-success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.alert-danger {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.alert-warning {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeeba;
}

/* Responsive Styles */
@media (max-width: 768px) {
  .app-header .container {
    flex-direction: column;
    gap: 1rem;
  }
  
  nav {
    flex-wrap: wrap;
    justify-content: center;
  }
}

.auth-debug-panel {
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  padding: 15px;
  border-radius: 5px;
  z-index: 9999;
  max-width: 300px;
}

.auth-debug-panel button {
  margin-top: 10px;
  padding: 5px 10px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}

/* Add the fade transition styles */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style> 