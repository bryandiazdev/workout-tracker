<template>
  <div class="auth-config">
    <div class="container">
      <div class="card">
        <div class="card-header">
          <h2>Auth0 Configuration Helper</h2>
        </div>
        <div class="card-body">
          <div v-if="configIssue" class="alert alert-warning">
            <h5><i class="fas fa-exclamation-triangle"></i> Auth0 Configuration Issue Detected</h5>
            <p>{{ configIssueMessage }}</p>
          </div>
          
          <h3>Required Auth0 Configuration Settings</h3>
          <p>To ensure proper functioning of the application authentication flow, please configure the following settings in your Auth0 dashboard:</p>
          
          <div class="config-section">
            <h4>1. Allowed Callback URLs</h4>
            <div class="config-value">
              <code>http://localhost:8080/callback</code>
              <button class="btn btn-sm btn-secondary copy-btn" @click="copyToClipboard('http://localhost:8080/callback')">
                Copy
              </button>
            </div>
            <p>This URL is used when returning from the Auth0 login page.</p>
          </div>
          
          <div class="config-section">
            <h4>2. Allowed Logout URLs</h4>
            <div class="config-value">
              <code>http://localhost:8080</code>
              <button class="btn btn-sm btn-secondary copy-btn" @click="copyToClipboard('http://localhost:8080')">
                Copy
              </button>
            </div>
            <p>This URL is where users will be redirected after logging out.</p>
          </div>
          
          <div class="config-section">
            <h4>3. Allowed Web Origins</h4>
            <div class="config-value">
              <code>http://localhost:8080</code>
              <button class="btn btn-sm btn-secondary copy-btn" @click="copyToClipboard('http://localhost:8080')">
                Copy
              </button>
            </div>
            <p>This allows the application to make requests to Auth0.</p>
          </div>
          
          <h3>How to Configure These Settings</h3>
          <ol>
            <li>Log in to your <a href="https://manage.auth0.com" target="_blank">Auth0 Dashboard</a></li>
            <li>Select your application</li>
            <li>Navigate to the "Settings" tab</li>
            <li>Scroll down to find each of the fields above</li>
            <li>Add the provided URLs to each corresponding field</li>
            <li>Click the "Save Changes" button at the bottom of the page</li>
          </ol>
          
          <div class="mt-4">
            <button class="btn btn-primary" @click="returnToApp">
              Return to Application
            </button>
            
            <button class="btn btn-outline-primary ml-2" @click="openAuth0Dashboard">
              Open Auth0 Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

export default {
  name: 'AuthConfig',
  setup() {
    const router = useRouter();
    const configIssue = ref(false);
    const configIssueMessage = ref('');
    
    onMounted(() => {
      // Check query params for error information
      const urlParams = new URLSearchParams(window.location.search);
      const error = urlParams.get('error');
      const errorDesc = urlParams.get('error_description');
      
      if (error) {
        configIssue.value = true;
        if (error === 'invalid_request' && errorDesc && errorDesc.includes('returnTo')) {
          configIssueMessage.value = 'The logout URL is not properly configured in Auth0. Please add "http://localhost:8080" to the "Allowed Logout URLs" in your Auth0 application settings.';
        } else {
          configIssueMessage.value = errorDesc || 'An unknown Auth0 configuration issue was detected.';
        }
      }
    });
    
    const copyToClipboard = (text) => {
      navigator.clipboard.writeText(text)
        .then(() => {
          alert('Copied to clipboard!');
        })
        .catch(err => {
          console.error('Failed to copy text: ', err);
        });
    };
    
    const returnToApp = () => {
      router.push('/');
    };
    
    const openAuth0Dashboard = () => {
      window.open('https://manage.auth0.com', '_blank');
    };
    
    return {
      configIssue,
      configIssueMessage,
      copyToClipboard,
      returnToApp,
      openAuth0Dashboard
    };
  }
};
</script>

<style scoped>
.auth-config {
  padding: 40px 0;
}

.config-section {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 5px;
}

.config-value {
  display: flex;
  align-items: center;
  margin: 10px 0;
  background-color: #e9ecef;
  padding: 8px;
  border-radius: 4px;
}

code {
  flex-grow: 1;
  padding: 5px 10px;
  background-color: #fff;
  border-radius: 3px;
}

.copy-btn {
  margin-left: 10px;
}

.ml-2 {
  margin-left: 0.5rem;
}
</style> 