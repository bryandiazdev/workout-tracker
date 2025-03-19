<template>
  <div class="container">
    <div class="spinner-container">
      <div class="spinner"></div>
      <p>{{ statusMessage }}</p>
      <div v-if="authError" class="error-message">
        {{ authError }}
      </div>
    </div>
  </div>
</template>

<script>
import AuthService from '../services/AuthService';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { onMounted, ref } from 'vue';
import DebugService from '../services/DebugService';

export default {
  name: 'Callback',
  setup() {
    const router = useRouter();
    const store = useStore();
    const authError = ref(null);
    const statusMessage = ref('Logging you in...');
    
    // Redirect to the specified path after a delay
    const delayedRedirect = (path, delayMs = 500) => {
      console.log(`Will redirect to ${path} in ${delayMs}ms`);
      statusMessage.value = `Redirecting you to application...`;
      
      setTimeout(() => {
        router.push(path);
      }, delayMs);
    };

    onMounted(async () => {
      DebugService.logNavigation('Callback page mounted');
      console.log('Callback component mounted, processing authentication result...');
      statusMessage.value = 'Processing authentication...';
      
      // Check for hash presence
      if (!window.location.hash || window.location.hash.length < 2) {
        console.error('No hash in URL - Auth0 did not send tokens');
        authError.value = 'Authentication failed: No tokens received from Auth0';
        statusMessage.value = 'Authentication failed!';
        delayedRedirect('/login');
        return;
      }

      // Check for error in hash
      if (window.location.hash.includes('error=')) {
        console.error('Error parameter found in hash:', window.location.hash);
        const errorMatch = window.location.hash.match(/error=([^&]*)/);
        const errorDescMatch = window.location.hash.match(/error_description=([^&]*)/);
        
        const errorCode = errorMatch ? decodeURIComponent(errorMatch[1]) : 'unknown';
        const errorDesc = errorDescMatch ? decodeURIComponent(errorDescMatch[1]) : 'Unknown error';
        
        authError.value = `Auth0 Error: ${errorCode} - ${errorDesc}`;
        statusMessage.value = 'Authentication failed!';
        DebugService.logAuth('Authentication error found in hash', {
          errorCode,
          errorDesc
        });
        delayedRedirect('/login');
        return;
      }
      
      try {
        console.log('Calling AuthService.handleAuthentication()...');
        statusMessage.value = 'Validating authentication...';
        const success = await AuthService.handleAuthentication();
        console.log('Auth result:', success ? 'SUCCESS' : 'FAILED');
        
        if (success) {
          console.log('Authentication successful, getting user info...');
          statusMessage.value = 'Getting user information...';
          
          try {
            // First verify that tokens were correctly saved
            const token = localStorage.getItem('auth_token');
            const idToken = localStorage.getItem('id_token');
            
            if (!token || !idToken) {
              throw new Error('Authentication tokens not saved properly');
            }
            
            console.log('Tokens saved successfully:', {
              hasAccessToken: !!token,
              hasIdToken: !!idToken
            });
            
            const user = await AuthService.getUser();
            console.log('User info retrieved:', user ? 'User found' : 'No user data');
            
            if (!user) {
              throw new Error('No user data received');
            }
            
            // Store user data in Vuex
            store.commit('setUser', user);
            console.log('User data saved in Vuex store:', user);
            
            // Force refresh authentication state for UI
            store.commit('setAuthenticated', true);
            
            // Verify auth state after everything is done
            const isAuth = AuthService.isAuthenticated();
            console.log('Final auth check before redirect:', isAuth);
            
            if (!isAuth) {
              throw new Error('Authentication state verification failed');
            }
            
            // Show success message
            store.dispatch('showMessage', {
              message: 'Login successful!',
              type: 'success'
            });
            
            // Immediate redirect to dashboard
            console.log('Authentication complete, redirecting to dashboard...');
            statusMessage.value = 'Login successful!';
            DebugService.logAuth('Authentication completed successfully');
            delayedRedirect('/dashboard');
          } catch (userError) {
            console.error('Error getting user info:', userError);
            authError.value = 'Login successful but failed to get user info. Please try again.';
            statusMessage.value = 'Failed to get user information';
            DebugService.logAuth('Error getting user info', { error: userError.message });
            delayedRedirect('/login');
          }
        } else {
          console.log('Authentication failed without error, redirecting to login...');
          authError.value = 'Authentication failed. Please try again.';
          statusMessage.value = 'Authentication failed!';
          DebugService.logAuth('Authentication failed without specific error');
          delayedRedirect('/login');
        }
      } catch (error) {
        console.error('Authentication error caught:', error);
        authError.value = error.message || 'Authentication error. Please try again.';
        statusMessage.value = 'Authentication failed!';
        DebugService.logAuth('Authentication error', { error: error.message });
        delayedRedirect('/login');
      }
    });

    return {
      authError,
      statusMessage
    };
  }
};
</script>

<style scoped>
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80vh;
}

.spinner-container {
  text-align: center;
  padding: 2rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  max-width: 400px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid var(--primary-color, #3498db);
  border-radius: 50%;
  margin: 0 auto 1rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  color: var(--danger-color, #e74c3c);
  margin-top: 1rem;
  padding: 1rem;
  background-color: rgba(231, 76, 60, 0.1);
  border-radius: 4px;
}
</style> 