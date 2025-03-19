# Workout Plan Exercises API Documentation

This document provides information on the API endpoints available for managing exercises within workout plans in the WorkoutTracker application.

## Overview

The Workout Plan Exercises API allows you to:
- Add new exercises to a workout plan
- Retrieve all exercises for a specific workout plan
- Get details about a specific exercise in a workout plan
- Update an existing exercise in a workout plan
- Remove an exercise from a workout plan

## API Endpoints

All exercise-related endpoints follow the RESTful pattern:

```
/api/workoutplans/{planId}/exercises
```

### Authentication

All API requests require an Auth0 authentication token to be provided in the Authorization header:

```
Authorization: Bearer {your_auth_token}
```

## Endpoints

### 1. Get All Exercises for a Workout Plan

Retrieves all exercises associated with a specific workout plan.

**Request:**
- **Method:** GET
- **URL:** `/api/workoutplans/{planId}/exercises`

**Response:**
```json
{
  "planId": "67dae07076b64707ced59843",
  "exercises": [
    {
      "id": "67dae15b76b64707ced59844",
      "name": "Bench Press",
      "description": "Chest exercise with barbell",
      "sets": 3,
      "reps": 10,
      "weight": 135,
      "weightUnit": "lbs",
      "muscleGroups": ["chest", "triceps"],
      "createdDate": "2025-03-19T15:25:31.123Z"
    },
    // Additional exercises...
  ]
}
```

### 2. Get a Specific Exercise from a Workout Plan

Retrieves details about a specific exercise in a workout plan.

**Request:**
- **Method:** GET
- **URL:** `/api/workoutplans/{planId}/exercises/{exerciseId}`

**Response:**
```json
{
  "id": "67dae15b76b64707ced59844",
  "name": "Bench Press",
  "description": "Chest exercise with barbell",
  "sets": 3,
  "reps": 10,
  "weight": 135,
  "weightUnit": "lbs",
  "muscleGroups": ["chest", "triceps"],
  "createdDate": "2025-03-19T15:25:31.123Z"
}
```

### 3. Add Exercise to a Workout Plan

Adds a new exercise to a specific workout plan.

**Request:**
- **Method:** POST
- **URL:** `/api/workoutplans/{planId}/exercises`
- **Body:**
```json
{
  "name": "Deadlift",
  "description": "Compound exercise for back and legs",
  "sets": 3,
  "reps": 8,
  "weight": 225,
  "weightUnit": "lbs",
  "muscleGroups": ["back", "legs", "core"]
}
```

**Response:**
```json
{
  "message": "Exercise added successfully",
  "exercise": {
    "id": "67dae15b76b64707ced59845",
    "name": "Deadlift",
    "description": "Compound exercise for back and legs",
    "sets": 3,
    "reps": 8,
    "weight": 225,
    "weightUnit": "lbs",
    "muscleGroups": ["back", "legs", "core"],
    "createdDate": "2025-03-19T15:28:45.789Z"
  }
}
```

### 4. Update an Exercise in a Workout Plan

Updates an existing exercise within a workout plan.

**Request:**
- **Method:** PUT
- **URL:** `/api/workoutplans/{planId}/exercises/{exerciseId}`
- **Body:**
```json
{
  "sets": 4,
  "reps": 12,
  "weight": 185
}
```

**Response:**
```json
{
  "message": "Exercise updated successfully",
  "exercise": {
    "id": "67dae15b76b64707ced59844",
    "name": "Bench Press",
    "description": "Chest exercise with barbell",
    "sets": 4,
    "reps": 12,
    "weight": 185,
    "weightUnit": "lbs",
    "muscleGroups": ["chest", "triceps"],
    "createdDate": "2025-03-19T15:25:31.123Z",
    "updatedAt": "2025-03-19T15:30:22.456Z"
  }
}
```

### 5. Remove an Exercise from a Workout Plan

Removes an exercise from a workout plan.

**Request:**
- **Method:** DELETE
- **URL:** `/api/workoutplans/{planId}/exercises/{exerciseId}`

**Response:**
```json
{
  "message": "Exercise removed successfully"
}
```

## Error Responses

The API may return the following error responses:

### 400 Bad Request
- When required fields are missing
- When the URL format is invalid
- When the workout plan ID is invalid

```json
{
  "message": "Invalid workout plan ID"
}
```

### 401 Unauthorized
- When the authorization token is missing or invalid

```json
{
  "message": "Missing or invalid authorization token"
}
```

### 404 Not Found
- When the workout plan doesn't exist or doesn't belong to the user
- When the specified exercise doesn't exist in the workout plan

```json
{
  "message": "Workout plan not found or not accessible"
}
```
or
```json
{
  "message": "Exercise not found"
}
```

### 405 Method Not Allowed
- When using an unsupported HTTP method

```json
{
  "message": "Method PUT not allowed"
}
```

### 500 Internal Server Error
- When an unexpected error occurs during processing

```json
{
  "message": "Error processing workout plan exercises",
  "error": "Detailed error message"
}
```

## Examples

### Example: Adding an Exercise to a Workout Plan

**Request:**
```http
POST /api/workoutplans/67dae07076b64707ced59843/exercises
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Squats",
  "description": "Compound lower body exercise",
  "sets": 4,
  "reps": 12,
  "weight": 185,
  "weightUnit": "lbs",
  "muscleGroups": ["quads", "glutes", "hamstrings"]
}
```

**Response:**
```json
{
  "message": "Exercise added successfully",
  "exercise": {
    "id": "67dae15b76b64707ced59846",
    "name": "Squats",
    "description": "Compound lower body exercise",
    "sets": 4,
    "reps": 12,
    "weight": 185,
    "weightUnit": "lbs",
    "muscleGroups": ["quads", "glutes", "hamstrings"],
    "createdDate": "2025-03-19T15:35:12.789Z"
  }
}
```

## Usage in Frontend

Here's example code for using these endpoints in the frontend:

### Adding an Exercise to a Workout Plan
```javascript
async function addExerciseToWorkoutPlan(planId, exerciseData) {
  try {
    const response = await fetch(`/api/workoutplans/${planId}/exercises`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(exerciseData)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to add exercise: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error adding exercise:', error);
    throw error;
  }
}
```

### Getting All Exercises for a Workout Plan
```javascript
async function getWorkoutPlanExercises(planId) {
  try {
    const response = await fetch(`/api/workoutplans/${planId}/exercises`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch exercises: ${response.status}`);
    }
    
    const result = await response.json();
    return result.exercises;
  } catch (error) {
    console.error('Error fetching exercises:', error);
    throw error;
  }
}
```

## Implementation Details

The API endpoints are implemented in the unified API handler using MongoDB for data storage. Exercises are stored as an array within the workout plan document, which allows for efficient access and manipulation without the need for separate collections.

Each exercise has a unique ID generated using MongoDB's ObjectId, which ensures uniqueness across all exercises in all workout plans.

Security is enforced by checking that the workout plan belongs to the authenticated user before allowing any operations on its exercises. 