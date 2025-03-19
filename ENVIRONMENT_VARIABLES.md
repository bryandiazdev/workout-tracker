# Setting Up Environment Variables Securely

This guide explains how to set up environment variables for the WorkoutTracker application to keep sensitive information secure.

## Why This Matters

Environment variables allow you to:
1. Keep sensitive data (API keys, auth credentials) out of your code repository
2. Configure your application differently for development and production
3. Meet security best practices for modern web applications

## Local Development

For local development, create a `.env` file in the project root:

1. Copy the provided `.env.example` file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file with your actual values:
   ```
   # Auth0 Configuration
   VUE_APP_AUTH0_DOMAIN=your-actual-domain.auth0.com
   VUE_APP_AUTH0_CLIENT_ID=your-actual-client-id
   VUE_APP_AUTH0_AUDIENCE=https://workouttracker-api
   VUE_APP_AUTH0_CALLBACK_URL=http://localhost:8080/callback
   
   # API Configuration (use the local API for development)
   VUE_APP_API_URL=/api
   
   # Other Configuration
   NODE_ENV=development
   ```

3. **IMPORTANT:** The `.env` file should never be committed to your repository. It's already added to `.gitignore`.

## Vercel Deployment

For Vercel deployment, use the Vercel CLI to set environment variables securely:

### Option 1: Use the setup script

1. Make the setup script executable:
   ```bash
   chmod +x setup-env.sh
   ```

2. Run the script:
   ```bash
   ./setup-env.sh
   ```

3. Follow the prompts to set up all environment variables.

### Option 2: Set variables manually

Set each environment variable directly in Vercel:

```bash
vercel env add VUE_APP_AUTH0_DOMAIN
vercel env add VUE_APP_AUTH0_CLIENT_ID
vercel env add VUE_APP_AUTH0_AUDIENCE
vercel env add VUE_APP_AUTH0_CALLBACK_URL
```

### Option 3: Use Vercel Dashboard

1. Go to the [Vercel Dashboard](https://vercel.com)
2. Select your project
3. Go to "Settings" → "Environment Variables"
4. Add each variable with its value

## Verifying Environment Variables

To verify that your environment variables are set up correctly:

1. After deploying, go to your production URL: https://workout-tracker-rose.vercel.app
2. Check for any auth-related errors in the browser console
3. If you see errors related to missing Auth0 configuration, your environment variables may not be set correctly

## Debugging Environment Variables

If you're experiencing issues with environment variables:

1. In your Vue.js code, add temporary debug logging:
   ```js
   console.log('Auth0 Domain:', process.env.VUE_APP_AUTH0_DOMAIN || 'NOT SET');
   console.log('Auth0 Client ID:', process.env.VUE_APP_AUTH0_CLIENT_ID ? 'IS SET (hidden)' : 'NOT SET');
   ```

2. Check Vercel build logs for environment variable issues
3. Make sure to redeploy after changing environment variables

Remember to remove any debug logging before final deployment! 