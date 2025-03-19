<template>
  <div class="debug-page">
    <h1>Authentication Diagnostics</h1>
    
    <div class="card">
      <div class="card-header">
        <h2>Authentication Status</h2>
      </div>
      <div class="card-body">
        <div class="status-indicator" :class="isAuthenticated ? 'status-success' : 'status-danger'">
          <span>{{ isAuthenticated ? 'Authenticated' : 'Not Authenticated' }}</span>
        </div>
        
        <div class="debug-info">
          <p><strong>Has Auth Token:</strong> {{ hasToken ? 'Yes' : 'No' }}</p>
          <p><strong>Token Expiry:</strong> {{ tokenExpiry }}</p>
          <p><strong>Time Remaining:</strong> {{ timeRemaining }}</p>
          <p><strong>Has User Profile:</strong> {{ hasUserProfile ? 'Yes' : 'No' }}</p>
        </div>
        
        <div class="actions">
          <button @click="forceLogout" class="btn btn-danger">Force Logout</button>
          <button @click="testBackend" class="btn btn-primary">Test Backend Connection</button>
          <button @click="testAuthenticatedEndpoint" class="btn btn-primary">Test Auth Endpoint</button>
        </div>
      </div>
    </div>
    
    <div class="card mt-4" v-if="hasToken">
      <div class="card-header">
        <h2>Token Information</h2>
      </div>
      <div class="card-body">
        <div class="token-tabs">
          <button 
            @click="activeTab = 'decoded'" 
            :class="{ active: activeTab === 'decoded' }"
            class="tab-btn">
            Decoded Token
          </button>
          <button 
            @click="activeTab = 'raw'" 
            :class="{ active: activeTab === 'raw' }"
            class="tab-btn">
            Raw Token
          </button>
        </div>
        
        <div class="token-content">
          <div v-if="activeTab === 'decoded'" class="token-decoded">
            <h3>Header</h3>
            <pre>{{ tokenHeader }}</pre>
            
            <h3>Payload</h3>
            <pre>{{ tokenPayload }}</pre>
          </div>
          
          <div v-if="activeTab === 'raw'" class="token-raw">
            <textarea readonly>{{ token }}</textarea>
            <button @click="copyToken" class="btn btn-sm btn-secondary">Copy Token</button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="card mt-4">
      <div class="card-header">
        <h2>API Connection Tests</h2>
      </div>
      <div class="card-body">
        <div v-if="testResults.length === 0" class="no-tests">
          No test results yet. Click "Test Backend Connection" to begin testing.
        </div>
        
        <div v-else class="test-results">
          <div 
            v-for="(result, index) in testResults" 
            :key="index"
            class="test-result"
            :class="{ 
              'test-success': result.success, 
              'test-error': !result.success 
            }">
            <div class="result-header">
              <span class="result-title">{{ result.title }}</span>
              <span class="result-status">{{ result.success ? 'Success' : 'Failed' }}</span>
            </div>
            <div class="result-details">
              <pre>{{ formatResult(result.data) }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="card mt-4">
      <div class="card-header">
        <h2>Actions</h2>
      </div>
      <div class="card-body">
        <div class="debug-actions">
          <button @click="clearLocalStorage" class="btn btn-warning">Clear All Local Storage</button>
          <button @click="goToLogin" class="btn btn-primary">Go to Login Page</button>
          <button @click="goToAuthConfig" class="btn btn-secondary">Auth0 Configuration Page</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AuthService from '../services/AuthService';
import DebugService from '../services/DebugService';
import ApiService from '../services/ApiService';

export default {
  name: 'Debug',
  setup() {
    const router = useRouter();
    const token = ref('');
    const tokenHeader = ref({});
    const tokenPayload = ref({});
    const isAuthenticated = ref(false);
    const hasToken = ref(false);
    const hasUserProfile = ref(false);
    const expiresAt = ref(0);
    const activeTab = ref('decoded');
    const testResults = ref([]);
    
    const tokenExpiry = computed(() => {
      if (!expiresAt.value) return 'No expiry set';
      return new Date(expiresAt.value).toLocaleString();
    });
    
    const timeRemaining = computed(() => {
      if (!expiresAt.value) return 'N/A';
      
      const now = new Date().getTime();
      const expiry = expiresAt.value;
      
      if (now >= expiry) {
        return 'Expired';
      }
      
      const diff = expiry - now;
      const minutes = Math.floor(diff / 1000 / 60);
      const seconds = Math.floor((diff / 1000) % 60);
      
      return `${minutes}m ${seconds}s`;
    });
    
    const loadTokenData = () => {
      // Get token from localStorage
      const authToken = localStorage.getItem('auth_token');
      const userProfile = localStorage.getItem('user_profile');
      const expiry = localStorage.getItem('expires_at');
      
      hasToken.value = !!authToken;
      hasUserProfile.value = !!userProfile;
      expiresAt.value = expiry ? JSON.parse(expiry) : 0;
      
      if (authToken) {
        token.value = authToken;
        
        try {
          // Parse token parts
          const parts = authToken.split('.');
          if (parts.length === 3) {
            tokenHeader.value = JSON.parse(atob(parts[0]));
            tokenPayload.value = JSON.parse(atob(parts[1]));
          }
        } catch (error) {
          console.error('Error parsing token:', error);
          testResults.value.push({
            title: 'Token Parsing Error',
            success: false,
            data: { error: error.message }
          });
        }
      }
      
      // Check if authenticated
      isAuthenticated.value = AuthService.isAuthenticated();
    };
    
    const testBackend = async () => {
      console.log('Testing backend connection...');
      DebugService.logApi('Testing backend connection');
      
      try {
        const apiUrl = '/api';
        const healthResponse = await fetch(`${apiUrl}/health`);
        const healthData = await healthResponse.json();
        
        testResults.value.push({
          title: 'Backend Health Check',
          success: healthResponse.ok,
          data: {
            status: healthResponse.status,
            statusText: healthResponse.statusText,
            responseData: healthData
          }
        });
        
        return healthResponse.ok;
      } catch (error) {
        console.error('Error testing backend:', error);
        
        testResults.value.push({
          title: 'Backend Connection Error',
          success: false,
          data: {
            error: error.message,
            suggestion: 'Make sure the API is operational'
          }
        });
        
        return false;
      }
    };
    
    const testAuthenticatedEndpoint = async () => {
      console.log('Testing authenticated endpoint...');
      DebugService.logApi('Testing authenticated endpoint');
      
      try {
        const apiUrl = '/api';
        const authResponse = await fetch(`${apiUrl}/health/auth`, {
          headers: {
            'Authorization': `Bearer ${token.value}`
          }
        });
        
        if (authResponse.ok) {
          const authData = await authResponse.json();
          
          testResults.value.push({
            title: 'Authenticated Endpoint Test',
            success: true,
            data: {
              status: authResponse.status,
              statusText: authResponse.statusText,
              responseData: authData
            }
          });
          
          return true;
        } else {
          if (authResponse.status === 401) {
            // Get more details on the unauthorized response
            testResults.value.push({
              title: 'Authentication Failed (401)',
              success: false,
              data: {
                status: authResponse.status,
                statusText: authResponse.statusText,
                tokenAudience: tokenPayload.value?.aud,
                tokenIssuer: tokenPayload.value?.iss,
                tokenExpiry: tokenPayload.value?.exp ? new Date(tokenPayload.value.exp * 1000).toLocaleString() : 'unknown',
                suggestion: 'Token may be invalid or expired. Try logging out and logging in again.'
              }
            });
          } else {
            testResults.value.push({
              title: 'Authenticated Endpoint Error',
              success: false,
              data: {
                status: authResponse.status,
                statusText: authResponse.statusText
              }
            });
          }
          
          return false;
        }
      } catch (error) {
        console.error('Error testing authenticated endpoint:', error);
        
        testResults.value.push({
          title: 'Authenticated Endpoint Error',
          success: false,
          data: {
            error: error.message
          }
        });
        
        return false;
      }
    };
    
    const formatResult = (data) => {
      return JSON.stringify(data, null, 2);
    };
    
    const copyToken = () => {
      navigator.clipboard.writeText(token.value)
        .then(() => {
          alert('Token copied to clipboard!');
        })
        .catch(err => {
          console.error('Failed to copy token: ', err);
        });
    };
    
    const clearLocalStorage = () => {
      localStorage.clear();
      alert('Local storage cleared. You will need to log in again.');
      loadTokenData();
    };
    
    const forceLogout = () => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('id_token');
      localStorage.removeItem('expires_at');
      localStorage.removeItem('user_profile');
      localStorage.removeItem('user_state');
      localStorage.removeItem('auth_state');
      
      alert('You have been logged out.');
      loadTokenData();
    };
    
    const goToLogin = () => {
      router.push('/login');
    };
    
    const goToAuthConfig = () => {
      router.push('/auth-config');
    };
    
    onMounted(() => {
      loadTokenData();
      
      // Run initial connection test
      testBackend();
    });
    
    return {
      token,
      tokenHeader,
      tokenPayload,
      isAuthenticated,
      hasToken,
      hasUserProfile,
      tokenExpiry,
      timeRemaining,
      activeTab,
      testResults,
      testBackend,
      testAuthenticatedEndpoint,
      formatResult,
      copyToken,
      clearLocalStorage,
      forceLogout,
      goToLogin,
      goToAuthConfig
    };
  }
};
</script>

<style scoped>
.debug-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  overflow: hidden;
}

.card-header {
  background-color: #f8f9fa;
  padding: 15px 20px;
  border-bottom: 1px solid #e9ecef;
}

.card-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.card-body {
  padding: 20px;
}

.status-indicator {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: bold;
  margin-bottom: 15px;
}

.status-success {
  background-color: #d4edda;
  color: #155724;
}

.status-danger {
  background-color: #f8d7da;
  color: #721c24;
}

.debug-info {
  margin-bottom: 20px;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  border: none;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-warning {
  background-color: #ffc107;
  color: #212529;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 0.875rem;
}

.mt-4 {
  margin-top: 20px;
}

.token-tabs {
  display: flex;
  border-bottom: 1px solid #dee2e6;
  margin-bottom: 15px;
}

.tab-btn {
  padding: 10px 15px;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 500;
  color: #495057;
}

.tab-btn.active {
  color: #007bff;
  border-bottom: 2px solid #007bff;
}

pre {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre-wrap;
}

.token-raw textarea {
  width: 100%;
  height: 100px;
  margin-bottom: 10px;
  padding: 10px;
  font-family: monospace;
  border: 1px solid #ced4da;
  border-radius: 4px;
}

.test-result {
  margin-bottom: 15px;
  border-radius: 4px;
  overflow: hidden;
}

.test-success .result-header {
  background-color: #d4edda;
  color: #155724;
}

.test-error .result-header {
  background-color: #f8d7da;
  color: #721c24;
}

.result-header {
  padding: 10px 15px;
  display: flex;
  justify-content: space-between;
  font-weight: 500;
}

.result-details {
  padding: 0;
}

.result-details pre {
  margin: 0;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}

.debug-actions {
  display: flex;
  gap: 10px;
}

.no-tests {
  font-style: italic;
  color: #6c757d;
  text-align: center;
  padding: 20px;
}
</style> 