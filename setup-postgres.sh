#!/bin/bash

# PostgreSQL setup script for WorkoutTracker
# This script creates the database, user, and applies initial schema

# Configuration
DB_NAME="workout_tracker"
DB_USER="postgres"
DB_PASSWORD="postgres"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
MIGRATION_SCRIPT="${SCRIPT_DIR}/WorkoutTracker.Api/InitialMigration.sql"

echo "Setting up PostgreSQL database for WorkoutTracker"
echo "------------------------------------------------"

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo "PostgreSQL client (psql) not found!"
    echo "Please install PostgreSQL first."
    echo "On macOS: brew install postgresql"
    echo "On Ubuntu: sudo apt install postgresql postgresql-contrib"
    exit 1
fi

# Check if PostgreSQL server is running
if ! pg_isready &> /dev/null; then
    echo "PostgreSQL server is not running!"
    echo "Please start PostgreSQL server first."
    echo "On macOS: brew services start postgresql"
    echo "On Ubuntu: sudo systemctl start postgresql"
    exit 1
fi

# Create database
echo "Creating database $DB_NAME..."
createdb -U $DB_USER $DB_NAME 2>/dev/null || echo "Database already exists (continuing)"

# Apply migration script
echo "Applying database schema..."
if [ -f "$MIGRATION_SCRIPT" ]; then
    psql -U $DB_USER -d $DB_NAME -f "$MIGRATION_SCRIPT"
    echo "Schema applied successfully!"
else
    echo "Migration script not found at: $MIGRATION_SCRIPT"
    echo "Please generate the migration script first with:"
    echo "cd WorkoutTracker.Api && dotnet ef migrations script -o InitialMigration.sql"
    exit 1
fi

echo "------------------------------------------------"
echo "PostgreSQL setup completed successfully!"
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo "Connection string: Host=localhost;Database=$DB_NAME;Username=$DB_USER;Password=$DB_PASSWORD;Port=5432"
echo ""
echo "You can now start the API with:"
echo "cd WorkoutTracker.Api && dotnet run" 