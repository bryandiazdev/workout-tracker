<template>
  <div class="login-container">
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Login to WorkoutTracker</h2>
      </div>
      <div class="card-body">
        <p class="mb-4">
          Track your fitness journey, set goals, and monitor your progress
          with WorkoutTracker.
        </p>
        
        <div v-if="authError" class="alert alert-danger">
          {{ authError }}
        </div>
        
        <div class="login-methods">
          <button @click="regularLogin" class="btn btn-primary btn-block">
            Login with Auth0
          </button>
        </div>
        
        <div class="mt-4">
          <p class="text-center">
            By logging in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
    
    <div class="login-footer">
      <p>Don't have an account? <a href="#" @click.prevent="regularLogin">Sign up</a></p>
    </div>
  </div>
</template>

<script>
import AuthService from '../services/AuthService';
import { ref } from 'vue';

export default {
  name: 'Login',
  setup() {
    const authError = ref('');
    const showDebug = ref(false);
    
    const authDomain = process.env.VUE_APP_AUTH0_DOMAIN;
    const clientId = process.env.VUE_APP_AUTH0_CLIENT_ID;
    const callbackUrl = 'http://localhost:8080/callback';
    const audience = process.env.VUE_APP_AUTH0_AUDIENCE;
    
    const regularLogin = () => {
      try {
        AuthService.login();
      } catch (error) {
        console.error('Login error:', error);
        authError.value = 'Failed to initialize login. Please try again or use the direct login method.';
      }
    };
    
    const directLogin = () => {
      try {
        // Generate state for security
        const state = generateRandomString();
        localStorage.setItem('auth_state', state);
        
        // Generate nonce for security
        const nonce = generateRandomString();
        localStorage.setItem('auth_nonce', nonce);
        
        // Build the authorization URL manually
        const authUrl = `https://${authDomain}/authorize` +
          `?client_id=${encodeURIComponent(clientId)}` +
          `&response_type=token%20id_token` +
          `&redirect_uri=${encodeURIComponent(callbackUrl)}` +
          `&scope=${encodeURIComponent('openid profile email')}` +
          `&audience=${encodeURIComponent(audience)}` +
          `&state=${encodeURIComponent(state)}` +
          `&nonce=${encodeURIComponent(nonce)}`;
        
        console.log('Direct login URL:', authUrl);
        
        // Redirect to Auth0 login page
        window.location.href = authUrl;
      } catch (error) {
        console.error('Direct login error:', error);
        authError.value = 'Failed to initialize direct login. Please try again.';
      }
    };
    
    const generateRandomString = () => {
      const crypto = window.crypto || window.msCrypto;
      const array = new Uint32Array(5);
      crypto.getRandomValues(array);
      return Array.from(array).map(n => n.toString(36)).join('');
    };
    
    return {
      authError,
      showDebug,
      authDomain,
      clientId,
      callbackUrl,
      audience,
      regularLogin,
      directLogin
    };
  }
};
</script>

<style scoped>
.login-container {
  max-width: 500px;
  margin: 2rem auto;
  padding: 1rem;
}

.mb-4 {
  margin-bottom: 1.5rem;
}

.mt-4 {
  margin-top: 1.5rem;
}

.text-center {
  text-align: center;
}

.login-methods {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.btn-block {
  display: block;
  width: 100%;
}

.login-footer {
  margin-top: 2rem;
  text-align: center;
}

.auth-debug {
  margin-top: 2rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 0.5rem;
  font-size: 0.9rem;
}

.auth-debug p {
  margin-bottom: 0.5rem;
}
</style> 