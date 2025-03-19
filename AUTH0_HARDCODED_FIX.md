# Auth0 Authentication Hardcoded Fix

## The Issue

We encountered an issue with Auth0 authentication where the URL was being constructed incorrectly:

```
vue_app_auth0_domain=dev-47c4icnwccbjdiz5.us.auth0.com/authorize?client_id=...
```

This happened because despite our environment variable configurations, the build process was not correctly substituting `process.env.VUE_APP_AUTH0_DOMAIN` with its actual value.

## The Solution

We've implemented a more direct solution by hardcoding the Auth0 configuration directly in the AuthService.js file:

```javascript
// Hard-coded Auth0 configuration to avoid environment variable issues
const AUTH0_CONFIG = {
  domain: 'dev-47c4icnwccbjdiz5.us.auth0.com',
  clientID: '6VxrjlK5YXdXm9FVX2GFPpBdwDShwuTc',
  audience: 'https://workouttracker-api',
  responseType: 'token id_token',
  scope: 'openid profile email'
};
```

This ensures that:
1. The correct domain is used regardless of build-time environment variable processing
2. No string substitution issues can occur
3. The application always uses the correct Auth0 configuration

## Deployment

The updated deployment script now rebuilds the application before deploying to ensure the hardcoded values are properly included in the build:

```bash
# Rebuild the application
cd WorkoutTracker.Client && npm run build && cd ..

# Deploy to Vercel
vercel --prod
```

## Testing Authentication

After deploying, test authentication by:

1. Visit your application at https://workout-tracker-rose.vercel.app
2. Click on the login button
3. You should be redirected to the correct Auth0 login page (domain: dev-47c4icnwccbjdiz5.us.auth0.com)
4. After logging in, you should be redirected back to your application

## Security Considerations

While hardcoding Auth0 configuration is not ideal for applications that need to change environments frequently, it's a pragmatic solution for applications with a single deployment target. The Auth0 client ID and domain are considered "public" information in a single-page application context.

For future improvements, consider:
1. Using build-time environment variables with proper webpack DefinePlugin configuration
2. Using a runtime configuration file that's generated during build
3. Setting up an API endpoint that provides Auth0 configuration to the client

## Troubleshooting

If you encounter any issues:

1. Verify the hardcoded values match your Auth0 application settings
2. Check your browser's network tab to ensure the correct URL is being used for authentication
3. Try clearing your browser cache and local storage before testing again 