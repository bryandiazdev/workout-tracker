# Workout Tracker Monorepo

This repository contains both the API and client components of the Workout Tracker application.

## Quick Start

### Prerequisites
- Node.js and npm
- .NET 9.0 SDK

### Installation

1. Clone this repository
2. Install dependencies:
```bash
npm run install:all
```

### Running the Application

To run both the API and client simultaneously:
```bash
npm start
```

This will start:
- The .NET API at http://localhost:5000
- The Vue client at http://localhost:8080

### Development

To run just the API:
```bash
npm run start:api
```

To run just the client:
```bash
npm run start:client
```

### Building

To build both applications:
```bash
npm run build
```

To build individual applications:
```bash
npm run build:api   # Build the API
npm run build:client # Build the client
```

### Cleaning

To clean all build artifacts and dependencies:
```bash
npm run clean
```

To clean individual projects:
```bash
npm run clean:api    # Clean the API build artifacts
npm run clean:client # Clean the client node_modules
```

## Project Structure

- `WorkoutTracker.Api/` - .NET backend API
- `WorkoutTracker.Client/` - Vue.js frontend application

## Features

- **User Authentication**: Secure authentication using Auth0
- **Workout Plans**: Create and manage customized workout plans
- **Workout Logging**: Record completed workouts with exercise details
- **Goal Setting**: Set fitness goals with various metrics like weight, strength, or endurance
- **Progress Tracking**: Visualize progress through stats and history
- **Responsive Design**: Works on mobile, tablet, and desktop devices

## Tech Stack

### Backend
- ASP.NET Core 6.0 API
- Entity Framework Core for data access
- SQLite database (can be replaced with SQL Server or PostgreSQL)
- REST API architecture

### Frontend
- Vue.js 3
- Vuex for state management
- Vue Router for routing
- Modern CSS with responsive design

## Prerequisites

- [.NET 6.0 SDK](https://dotnet.microsoft.com/download/dotnet/6.0)
- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- [Auth0 Account](https://auth0.com/) for authentication

## Setup Instructions

### Backend Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/WorkoutTracker.git
   cd WorkoutTracker
   ```

2. Navigate to the API project:
   ```
   cd WorkoutTracker.Api
   ```

3. Create and update the `appsettings.json` file with your Auth0 credentials:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Data Source=workouttracker.db"
     },
     "Auth0": {
       "Domain": "your-auth0-domain.auth0.com",
       "Audience": "your-audience-identifier"
     },
     "Logging": {
       "LogLevel": {
         "Default": "Information",
         "Microsoft": "Warning",
         "Microsoft.Hosting.Lifetime": "Information"
       }
     },
     "AllowedHosts": "*"
   }
   ```

4. Run database migrations:
   ```
   dotnet ef database update
   ```

5. Start the backend API:
   ```
   dotnet run
   ```
   The API will be available at `https://localhost:5001`

### Frontend Setup

1. Navigate to the client project:
   ```
   cd ../WorkoutTracker.Client
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with your Auth0 configuration:
   ```
   VUE_APP_AUTH0_DOMAIN=your-auth0-domain.auth0.com
   VUE_APP_AUTH0_CLIENT_ID=your-client-id
   VUE_APP_AUTH0_AUDIENCE=your-audience-identifier
   VUE_APP_API_URL=https://localhost:5001/api
   ```

4. Start the development server:
   ```
   npm run serve
   ```
   The client application will be available at `http://localhost:8080`

## Auth0 Setup

1. Create a new Auth0 Application (Single Page Web Application)
2. Configure the following settings:
   - Allowed Callback URLs: `http://localhost:8080/callback`
   - Allowed Logout URLs: `http://localhost:8080`
   - Allowed Web Origins: `http://localhost:8080`
3. Create a new API in Auth0
4. Configure permissions for the API:
   - `read:profile`
   - `update:profile`
   - `read:workouts`
   - `write:workouts`
   - `read:goals`
   - `write:goals`

## Usage

1. Register a new account or log in with an existing account
2. Create workout plans for different fitness goals
3. Log your completed workouts
4. Set and track fitness goals
5. View your workout history and progress on the dashboard

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request # workout-tracker
