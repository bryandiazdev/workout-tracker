# API Consolidation for Vercel Deployment

## Problem Encountered

Vercel's Hobby plan has a limitation of 12 serverless functions per deployment. Our API setup had separate handlers for each endpoint, which exceeded this limit:

```
Error: No more than 12 Serverless Functions can be added to a Deployment on the Hobby plan. 
Create a team (Pro plan) to deploy more. Learn More: https://vercel.link/function-count-limit
```

## Solution Implemented

To work within Vercel's limits, we've consolidated all API endpoints into a single serverless function (`/api/index.js`). This approach:

1. Reduces the number of serverless functions from 10+ to just 1
2. Maintains the same API functionality and endpoints
3. Allows deployment on the Hobby plan without upgrading

## How It Works

### Unified API Handler

The new `api/index.js` file serves as a router that:

1. Receives all API requests (`/api/*`)
2. Parses the URL path to determine which endpoint is being requested
3. Routes the request to the appropriate handler function
4. Maintains the same response format and behavior as the original separate handlers

### Updated Routes Configuration

The `vercel.json` file has been simplified to route all API requests to the unified handler:

```json
{
  "version": 2,
  "buildCommand": "./build.sh",
  "outputDirectory": "WorkoutTracker.Client/dist",
  "routes": [
    { "handle": "filesystem" },
    { "src": "/callback(.*)", "dest": "/index.html" },
    { "src": "/api/(.*)", "dest": "/api/index.js" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

## Supported Endpoints

The consolidated API still supports all original endpoints:

- `/api/goals` - Manage workout goals
- `/api/workoutlogs` - Track workout sessions
- `/api/workoutplans` - Manage workout plans
- `/api/users` - User profile management
- `/api/stats` - Statistical data and summaries
- `/api/health` - API health check
- `/api/mongodb-test` - MongoDB connection testing
- `/api/env-test` - Environment variable verification

## Benefits

- **Deployment on Free Tier**: Stays within Vercel's Hobby plan limits
- **Simplified Routing**: All API requests go through a single entry point
- **Reduced Cold Starts**: Fewer serverless functions can mean fewer cold starts
- **Consistent Error Handling**: Centralized error handling across all endpoints
- **Shared Code**: Common functionality like user ID extraction is shared

## Potential Trade-offs

- **Function Size**: The consolidated function is larger, which could affect cold start performance
- **Isolation**: Less isolation between endpoints (an error in one handler could affect others)
- **Complexity**: The router code adds a layer of complexity compared to separate files

## How to Maintain

When adding new API endpoints:

1. Add a new case to the switch statement in `api/index.js`
2. Create a new handler function in the same file
3. No need to update `vercel.json` as all `/api/*` requests are already routed to this handler

## Conclusion

This approach allows us to deploy the WorkoutTracker API on Vercel's Hobby plan while maintaining all functionality. If the application grows significantly, you might consider upgrading to the Pro plan or exploring other deployment options like AWS Lambda or Google Cloud Functions. 