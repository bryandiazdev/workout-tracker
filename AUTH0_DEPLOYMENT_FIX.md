# Auth0 Authentication Fix

## The Issue

There was a problem with how the Auth0 authentication URL was being constructed. When attempting to log in, you were seeing an error with a URL like:

```
https://vue_app_auth0_domain=dev-47c4icnwccbjdiz5.us.auth0.com/authorize?client_id=...
```

This happened because the environment variable `VUE_APP_AUTH0_DOMAIN` wasn't being properly substituted during the build process, causing the literal text of the variable name to be included in the URL.

## The Solution

We've fixed this issue with several changes:

1. **Updated AuthService.js**: Modified the login method to use Auth0's built-in authorize method instead of manually constructing the URL.

2. **Added dotenv support**: Added proper environment variable handling with dotenv in vue.config.js.

3. **Created client-specific .env file**: Added a .env file directly in the WorkoutTracker.Client directory.

4. **Updated deploy.sh script**: Ensured environment variables are properly set up in both Vercel and local development environments.

## How to Deploy

Follow these steps to deploy with the fixed Auth0 authentication:

1. Run the updated deployment script:
   ```bash
   ./deploy.sh
   ```

2. When prompted, choose "y" to update environment variables

3. Enter your Auth0 configuration values:
   - Auth0 Domain: `dev-47c4icnwccbjdiz5.us.auth0.com`
   - Auth0 Client ID: `6VxrjlK5YXdXm9FVX2GFPpBdwDShwuTc`
   - Auth0 Audience: `https://workouttracker-api`
   - Auth0 Callback URL: `https://workout-tracker-rose.vercel.app/callback`

4. The script will deploy your application to Vercel

## Testing Authentication

After deploying, test authentication by:

1. Visit your application at https://workout-tracker-rose.vercel.app
2. Click on the login button
3. You should be redirected to the Auth0 login page
4. After logging in, you should be redirected back to your application 

## Troubleshooting

If you encounter any issues:

1. **Check browser console**: Look for any errors related to Auth0 or environment variables

2. **Verify environment variables in Vercel**: 
   ```bash
   vercel env ls
   ```

3. **Check Auth0 application settings**:
   - Make sure the callback URL in Auth0 matches what you've set up
   - Confirm that the application type is set to "Single Page Application"
   - Verify that the Auth0 application has the correct API permissions

4. **Run locally to debug**:
   ```bash
   cd WorkoutTracker.Client
   npm run dev
   ``` 