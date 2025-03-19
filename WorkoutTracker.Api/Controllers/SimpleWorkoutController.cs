using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using WorkoutTracker.Api.Data;
using WorkoutTracker.Api.Models;

namespace WorkoutTracker.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SimpleWorkoutController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SimpleWorkoutController(ApplicationDbContext context)
        {
            _context = context;
        }

        // Helper method to get the user
        private async Task<User> GetOrCreateUser()
        {
            // First try the sub claim (standard JWT)
            var auth0Id = User.Claims.FirstOrDefault(c => c.Type == "sub")?.Value;
            
            // If sub claim not found, try the nameidentifier claim
            if (string.IsNullOrEmpty(auth0Id))
            {
                auth0Id = User.Claims.FirstOrDefault(c => 
                    c.Type == ClaimTypes.NameIdentifier || 
                    c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
            }
            
            if (string.IsNullOrEmpty(auth0Id))
            {
                throw new UnauthorizedAccessException("No valid user identifier found in token");
            }

            // Find or create the user
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Auth0Id == auth0Id);
            
            if (user == null)
            {
                // Extract name and email from claims
                var name = User.Claims.FirstOrDefault(c => c.Type == "name" || c.Type == ClaimTypes.Name)?.Value ?? "User";
                var email = User.Claims.FirstOrDefault(c => c.Type == "email" || c.Type == ClaimTypes.Email)?.Value ?? "user@example.com";
                
                // Create a new user
                user = new User
                {
                    Auth0Id = auth0Id,
                    Name = name,
                    Email = email,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                
                _context.Users.Add(user);
                await _context.SaveChangesAsync();
                Console.WriteLine($"[SimpleWorkout] Created new user with ID: {user.Id}");
            }
            else
            {
                Console.WriteLine($"[SimpleWorkout] Found existing user with ID: {user.Id}");
            }
            
            return user;
        }

        // POST: api/SimpleWorkout/Log
        [HttpPost("Log")]
        public async Task<ActionResult<WorkoutLog>> CreateWorkoutLog([FromBody] SimpleWorkoutLogRequest request)
        {
            try
            {
                Console.WriteLine("[SimpleWorkout] Creating workout log");
                
                // Get or create the user
                var user = await GetOrCreateUser();
                
                // Create the workout log
                var workoutLog = new WorkoutLog
                {
                    UserId = user.Id,
                    WorkoutDate = request.WorkoutDate.ToUniversalTime(),
                    Duration = request.Duration,
                    Notes = request.Notes ?? "Workout",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                
                // Save the workout log first
                _context.WorkoutLogs.Add(workoutLog);
                await _context.SaveChangesAsync();
                Console.WriteLine($"[SimpleWorkout] Created workout log with ID: {workoutLog.Id}");
                
                // Create and save exercise logs if provided
                if (request.ExerciseLogs != null && request.ExerciseLogs.Any())
                {
                    var exerciseLogs = new List<ExerciseLog>();
                    
                    foreach (var exerciseRequest in request.ExerciseLogs)
                    {
                        var exerciseLog = new ExerciseLog
                        {
                            WorkoutLogId = workoutLog.Id,
                            ExerciseName = exerciseRequest.ExerciseName ?? "Exercise",
                            Sets = exerciseRequest.Sets,
                            Reps = exerciseRequest.Reps,
                            Weight = exerciseRequest.Weight,
                            Notes = exerciseRequest.Notes ?? "",
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        };
                        
                        _context.ExerciseLogs.Add(exerciseLog);
                        exerciseLogs.Add(exerciseLog);
                        Console.WriteLine($"[SimpleWorkout] Adding exercise log: {exerciseLog.ExerciseName}");
                    }
                    
                    await _context.SaveChangesAsync();
                    Console.WriteLine($"[SimpleWorkout] Saved {exerciseLogs.Count} exercise logs");
                }
                
                // Load the complete workout log with exercise logs
                var savedWorkoutLog = await _context.WorkoutLogs
                    .Include(wl => wl.ExerciseLogs)
                    .FirstOrDefaultAsync(wl => wl.Id == workoutLog.Id);
                
                if (savedWorkoutLog == null)
                {
                    return StatusCode(500, new { error = "Failed to retrieve saved workout log" });
                }
                
                Console.WriteLine($"[SimpleWorkout] Retrieved saved workout log with {savedWorkoutLog.ExerciseLogs.Count} exercise logs");
                
                return Ok(new
                {
                    id = savedWorkoutLog.Id,
                    workoutDate = savedWorkoutLog.WorkoutDate,
                    duration = savedWorkoutLog.Duration,
                    notes = savedWorkoutLog.Notes,
                    exerciseLogs = savedWorkoutLog.ExerciseLogs.Select(el => new
                    {
                        id = el.Id,
                        exerciseName = el.ExerciseName,
                        sets = el.Sets,
                        reps = el.Reps,
                        weight = el.Weight,
                        notes = el.Notes
                    }).ToList()
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SimpleWorkout] Error creating workout log: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"[SimpleWorkout] Inner exception: {ex.InnerException.Message}");
                }
                Console.WriteLine($"[SimpleWorkout] Stack trace: {ex.StackTrace}");
                
                return StatusCode(500, new
                {
                    error = "Failed to create workout log",
                    message = ex.Message,
                    innerError = ex.InnerException?.Message
                });
            }
        }
        
        // POST: api/SimpleWorkout/Plan
        [HttpPost("Plan")]
        public async Task<ActionResult<WorkoutPlan>> CreateWorkoutPlan([FromBody] SimpleWorkoutPlanRequest request)
        {
            try
            {
                Console.WriteLine("[SimpleWorkout] Creating workout plan");
                
                // Get or create the user
                var user = await GetOrCreateUser();
                
                // Create the workout plan
                var workoutPlan = new WorkoutPlan
                {
                    UserId = user.Id,
                    Name = request.Name ?? "Workout Plan",
                    Description = request.Description ?? "",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                
                // Save the workout plan first
                _context.WorkoutPlans.Add(workoutPlan);
                await _context.SaveChangesAsync();
                Console.WriteLine($"[SimpleWorkout] Created workout plan with ID: {workoutPlan.Id}");
                
                // Create and save exercises if provided
                if (request.Exercises != null && request.Exercises.Any())
                {
                    var exercises = new List<Exercise>();
                    
                    foreach (var exerciseRequest in request.Exercises)
                    {
                        var exercise = new Exercise
                        {
                            WorkoutPlanId = workoutPlan.Id,
                            Name = exerciseRequest.Name ?? "Exercise",
                            Description = exerciseRequest.Description ?? "",
                            Sets = exerciseRequest.Sets,
                            Reps = exerciseRequest.Reps,
                            Weight = exerciseRequest.Weight,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        };
                        
                        _context.Exercises.Add(exercise);
                        exercises.Add(exercise);
                        Console.WriteLine($"[SimpleWorkout] Adding exercise: {exercise.Name}");
                    }
                    
                    await _context.SaveChangesAsync();
                    Console.WriteLine($"[SimpleWorkout] Saved {exercises.Count} exercises");
                }
                
                // Load the complete workout plan with exercises
                var savedWorkoutPlan = await _context.WorkoutPlans
                    .Include(wp => wp.Exercises)
                    .FirstOrDefaultAsync(wp => wp.Id == workoutPlan.Id);
                
                if (savedWorkoutPlan == null)
                {
                    return StatusCode(500, new { error = "Failed to retrieve saved workout plan" });
                }
                
                Console.WriteLine($"[SimpleWorkout] Retrieved saved workout plan with {savedWorkoutPlan.Exercises.Count} exercises");
                
                return Ok(new
                {
                    id = savedWorkoutPlan.Id,
                    name = savedWorkoutPlan.Name,
                    description = savedWorkoutPlan.Description,
                    exercises = savedWorkoutPlan.Exercises.Select(e => new
                    {
                        id = e.Id,
                        name = e.Name,
                        description = e.Description,
                        sets = e.Sets,
                        reps = e.Reps,
                        weight = e.Weight
                    }).ToList()
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SimpleWorkout] Error creating workout plan: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"[SimpleWorkout] Inner exception: {ex.InnerException.Message}");
                }
                Console.WriteLine($"[SimpleWorkout] Stack trace: {ex.StackTrace}");
                
                return StatusCode(500, new
                {
                    error = "Failed to create workout plan",
                    message = ex.Message,
                    innerError = ex.InnerException?.Message
                });
            }
        }
    }
    
    // Simple request models
    public class SimpleWorkoutLogRequest
    {
        public DateTime WorkoutDate { get; set; } = DateTime.UtcNow;
        public TimeSpan Duration { get; set; } = TimeSpan.FromMinutes(30);
        public string Notes { get; set; }
        public List<SimpleExerciseLogRequest> ExerciseLogs { get; set; } = new List<SimpleExerciseLogRequest>();
    }
    
    public class SimpleExerciseLogRequest
    {
        public string ExerciseName { get; set; }
        public int Sets { get; set; }
        public int Reps { get; set; }
        public decimal? Weight { get; set; }
        public string Notes { get; set; }
    }
    
    public class SimpleWorkoutPlanRequest
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public List<SimpleExerciseRequest> Exercises { get; set; } = new List<SimpleExerciseRequest>();
    }
    
    public class SimpleExerciseRequest
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public int Sets { get; set; }
        public int Reps { get; set; }
        public decimal? Weight { get; set; }
    }
} 