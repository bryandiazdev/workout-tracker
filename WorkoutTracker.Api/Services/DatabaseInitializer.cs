using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using WorkoutTracker.Api.Data;
using WorkoutTracker.Api.Models;
using System.Collections.Generic;

namespace WorkoutTracker.Api.Services
{
    public static class DatabaseInitializer
    {
        public static void Initialize(IServiceProvider serviceProvider)
        {
            using (var scope = serviceProvider.CreateScope())
            {
                var services = scope.ServiceProvider;
                try
                {
                    var context = services.GetRequiredService<ApplicationDbContext>();
                    
                    // Apply any pending migrations to ensure the database schema is up to date
                    Console.WriteLine("Applying any pending database migrations...");
                    context.Database.Migrate();
                    
                    Console.WriteLine("Database migrations applied successfully.");
                    
                    // Output some diagnostic information about the database
                    Console.WriteLine("Database connection: " + context.Database.GetConnectionString());
                    Console.WriteLine("Database provider: " + context.Database.ProviderName);
                    
                    // Check if tables exist and have data
                    var userCount = context.Users.Count();
                    var workoutPlanCount = context.WorkoutPlans.Count();
                    var workoutLogCount = context.WorkoutLogs.Count();
                    var goalCount = context.Goals.Count();
                    
                    Console.WriteLine($"Database contains: {userCount} users, {workoutPlanCount} workout plans, {workoutLogCount} workout logs, {goalCount} goals");
                    
                    // Check if database is empty and seed if needed
                    if (!context.Users.Any())
                    {
                        Console.WriteLine("No users found in database. Adding test data...");
                        SeedTestData(context);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"An error occurred while initializing the database: {ex.Message}");
                    if (ex.InnerException != null)
                    {
                        Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                    }
                    Console.WriteLine($"Stack trace: {ex.StackTrace}");
                }
            }
        }
        
        private static void SeedTestData(ApplicationDbContext context)
        {
            // Add a test user
            var testUser = new User
            {
                Auth0Id = "test-user",
                Name = "Test User",
                Email = "test@example.com",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                WorkoutPlans = new List<WorkoutPlan>(),
                WorkoutLogs = new List<WorkoutLog>(),
                Goals = new List<Goal>()
            };
            
            context.Users.Add(testUser);
            context.SaveChanges();
            
            Console.WriteLine($"Created test user with ID: {testUser.Id}");
            
            // Add a test workout plan
            var workoutPlan = new WorkoutPlan
            {
                Name = "Sample Workout Plan",
                Description = "A workout plan created during database initialization",
                UserId = testUser.Id,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Exercises = new List<Exercise>()
            };
            
            context.WorkoutPlans.Add(workoutPlan);
            context.SaveChanges();
            
            Console.WriteLine($"Created test workout plan with ID: {workoutPlan.Id}");
            
            // Add some exercises to the plan
            var exercises = new[]
            {
                new Exercise
                {
                    Name = "Push-Ups",
                    Description = "Basic chest exercise",
                    Sets = 3,
                    Reps = 10,
                    WorkoutPlanId = workoutPlan.Id,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Exercise
                {
                    Name = "Squats",
                    Description = "Basic leg exercise",
                    Sets = 3,
                    Reps = 15,
                    WorkoutPlanId = workoutPlan.Id,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            };
            
            context.Exercises.AddRange(exercises);
            context.SaveChanges();
            
            Console.WriteLine($"Created {exercises.Length} exercises");
            
            // Add a test goal
            var goal = new Goal
            {
                Name = "Sample Goal",
                Description = "A goal created during database initialization",
                UserId = testUser.Id,
                StartDate = DateTime.UtcNow,
                TargetDate = DateTime.UtcNow.AddMonths(3),
                CurrentValue = 0,
                TargetValue = 100,
                Type = GoalType.Weight,
                Unit = "kg",
                IsCompleted = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            context.Goals.Add(goal);
            context.SaveChanges();
            
            Console.WriteLine($"Created test goal with ID: {goal.Id}");
            
            Console.WriteLine("Test data seeding completed.");
        }
    }
} 