# Auth0 Vercel Environment Variable Fix

## The Problem

We've identified a specific issue with how Vercel is handling the Auth0 environment variables. In the build logs, we can see that the environment variable `VUE_APP_AUTH0_DOMAIN` is not being set correctly:

```
Building with environment variables:
- VUE_APP_AUTH0_CALLBACK_URL: https...
- VUE_APP_API_URL: /api...
- VUE_APP_AUTH0_AUDIENCE: https...
- VUE_APP_AUTH0_CLIENT_ID: 6Vxrj...
- VUE_APP_AUTH0_DOMAIN: VUE_A...
```

The domain is showing `VUE_A...` which means it's actually storing the literal `VUE_APP_AUTH0_DOMAIN` text instead of the actual domain value. This is causing the Auth0 URL to be malformed during authentication.

## The Two-Part Solution

We've implemented a comprehensive two-part solution to address this issue:

### 1. Robust AuthService.js with Fallbacks

We've updated the Auth0 service to be more resilient:

- It now checks if environment variables contain their own name (indicating they weren't properly substituted)
- It includes hardcoded fallback values that will be used automatically if the environment variables are invalid
- It logs which values are being used (environment variables or fallbacks) for easier debugging

### 2. Direct Vercel Environment Variable Fix

We've created a script `fix-vercel-env.sh` that will:

- Remove all existing environment variables
- Add them back with the correct values
- Ensure they are properly set in the Vercel environment

## How to Fix

Follow these steps to resolve the issue:

1. **Run the Vercel environment fix script:**

   ```bash
   ./fix-vercel-env.sh
   ```

   This will update the environment variables in Vercel directly, bypassing any issues with the interactive prompts.

2. **Deploy after fixing environment variables:**

   ```bash
   vercel --prod
   ```

3. **Verify the fix:**
   - After deployment, check the build logs to make sure the environment variables are properly set
   - You should see `VUE_APP_AUTH0_DOMAIN: dev-4...` instead of `VUE_APP_AUTH0_DOMAIN: VUE_A...`

## Fallback Safety Net

Even if the environment variables aren't correctly set, the application will now automatically fall back to hardcoded values. While not ideal from a security perspective, this ensures your application will continue to function even if there are environment variable issues.

The fallback values are:

```javascript
const DEFAULT_AUTH0_CONFIG = {
  domain: 'dev-47c4icnwccbjdiz5.us.auth0.com',
  clientID: '6VxrjlK5YXdXm9FVX2GFPpBdwDShwuTc',
  audience: 'https://workouttracker-api',
  callbackUrl: 'https://workout-tracker-rose.vercel.app/callback',
  responseType: 'token id_token',
  scope: 'openid profile email'
};
```

## Vercel Environment Variables Best Practices

For future reference, when setting environment variables in Vercel:

1. Use the direct command line approach with EOF syntax:
   ```bash
   vercel env add MY_VARIABLE production -y << EOF
   my_value
   EOF
   ```

2. Always verify environment variables after setting:
   ```bash
   vercel env ls
   ```

3. Consider using the Vercel Dashboard UI for setting environment variables if CLI issues persist

4. Always check build logs to confirm variables are set correctly before testing the application 