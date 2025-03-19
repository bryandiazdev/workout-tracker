# Vercel Analytics Integration

This document explains how Vercel Analytics has been integrated into the WorkoutTracker application.

## What is Vercel Analytics?

Vercel Analytics provides real-time insights into how users interact with your application, including:

- Page views and unique visitors
- Geographic distribution of users
- Device and browser statistics
- Performance metrics
- Custom events (with additional configuration)

The data is available in your Vercel dashboard under the "Analytics" tab for your project.

## Implementation Details

### 1. Installation

We've installed the Vercel Analytics package:

```bash
npm install @vercel/analytics
```

### 2. Integration

Analytics has been integrated at the application level in `WorkoutTracker.Client/src/main.js`:

```javascript
import { inject } from '@vercel/analytics';

// Initialize Vercel Analytics
inject();
```

This injects the analytics script into your application and begins tracking page views and other basic metrics automatically.

## Viewing Analytics Data

To view your analytics data:

1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your WorkoutTracker project
3. Navigate to the "Analytics" tab
4. View insights about your application's usage

## Privacy Considerations

Vercel Analytics is GDPR and CCPA compliant by default. It:

- Doesn't use cookies
- Doesn't track users across sites
- Anonymizes IP addresses
- Only collects minimal data needed for analytics

## Customizing Analytics

For more advanced usage (if needed in the future):

### Tracking Custom Events

```javascript
import { track } from '@vercel/analytics';

// Example: Track a custom event
function handleWorkoutComplete() {
  track('workout_completed', { 
    duration: workoutDuration,
    exercises: exerciseCount 
  });
}
```

### Disabling Analytics in Development

```javascript
import { inject } from '@vercel/analytics';

// Only enable analytics in production
if (process.env.NODE_ENV === 'production') {
  inject();
}
```

## Resources

- [Vercel Analytics Documentation](https://vercel.com/docs/analytics)
- [Analytics Package Documentation](https://www.npmjs.com/package/@vercel/analytics) 