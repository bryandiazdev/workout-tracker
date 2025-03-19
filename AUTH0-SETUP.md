# Auth0 Setup Guide for Workout Tracker

This guide will help you set up Auth0 authentication for the Workout Tracker application.

## 1. Create an Auth0 Account

If you don't already have an Auth0 account, sign up at [Auth0](https://auth0.com/).

## 2. Create a Single Page Application

1. In the Auth0 dashboard, go to "Applications" → "Applications"
2. Click "Create Application"
3. Name: "Workout Tracker"
4. Application Type: "Single Page Application"
5. Click "Create"
6. In the application settings, set the following:
   - Allowed Callback URLs: `http://localhost:8080/callback`
   - Allowed Logout URLs: `http://localhost:8080`
   - Allowed Web Origins: `http://localhost:8080`
   - Click "Save Changes"
7. Note your "Domain" and "Client ID" from the application settings

## 3. Create an API

1. In the Auth0 dashboard, go to "Applications" → "APIs"
2. Click "Create API"
3. Name: "Workout Tracker API"
4. Identifier: `https://workouttracker-api` (or choose your own)
5. Signing Algorithm: RS256
6. Click "Create"

## 4. Configure Your Application

### Client Configuration

Update the `.env` file in the `WorkoutTracker.Client` directory:

```
VUE_APP_AUTH0_DOMAIN=your-auth0-domain.auth0.com
VUE_APP_AUTH0_CLIENT_ID=your-client-id
VUE_APP_AUTH0_AUDIENCE=https://workouttracker-api
VUE_APP_API_URL=http://localhost:5000/api
```

Replace:
- `your-auth0-domain.auth0.com` with your Auth0 domain (e.g., `dev-abc123.us.auth0.com`)
- `your-client-id` with your application's Client ID
- `https://workouttracker-api` with your API identifier if you changed it

### API Configuration

Update the `appsettings.Development.json` file in the `WorkoutTracker.Api` directory:

```json
{
  "Auth0": {
    "Domain": "your-auth0-domain.auth0.com",
    "Audience": "https://workouttracker-api",
    "ClientId": "your-client-id",
    "ClientSecret": "ZWwTG8JOBDz6pjUm2N5TFCBoK1DdBH2ZWVhn0PYucrcXb4yQpqTZNZ99nMlbXYgR"
  },
  ...
}
```

Replace with your actual Auth0 values.

## 5. Test Your Configuration

After updating the configuration files with your Auth0 credentials:

1. Stop any running instances of the application
2. Start the application again: `npm start`
3. Navigate to http://localhost:8080
4. Try logging in with the Auth0 authentication flow

## Troubleshooting

### Common Issues

1. **"Invalid client" error during login**:
   - Check that your Client ID is correct in the `.env` file
   - Verify that the application is properly registered in Auth0

2. **"Invalid redirect URI" error**:
   - Make sure your Callback URL is correctly set to `http://localhost:8080/callback` in Auth0 dashboard

3. **"Invalid audience" error**:
   - Ensure your API identifier matches in both the client `.env` file and the API configuration

4. **No user profile after login**:
   - Check that your API is properly set up to handle the Auth0 tokens
   - Verify that the correct scopes are requested (`openid profile email`)

### Debug Tips

To debug authentication issues:
1. Open browser developer tools (F12)
2. Check the Console tab for error messages
3. Look at the Network tab for failed requests
4. Examine the request URL parameters to ensure they match your configuration

### Testing Auth0 Configuration

You can validate your Auth0 configuration by manually testing the authentication URL:

```
https://YOUR_DOMAIN.auth0.com/authorize?
  client_id=YOUR_CLIENT_ID&
  response_type=token%20id_token&
  redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fcallback&
  scope=openid%20profile%20email&
  audience=YOUR_AUDIENCE&
  state=YOUR_STATE&
  nonce=YOUR_NONCE
```

Replace the placeholders with your actual values to test. 