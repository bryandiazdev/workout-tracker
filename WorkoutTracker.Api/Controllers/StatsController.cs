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
    public class StatsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public StatsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // Helper method to get the Auth0 ID consistently
        private string GetAuth0Id()
        {
            // First try the sub claim (standard JWT)
            var auth0Id = User.Claims.FirstOrDefault(c => c.Type == "sub")?.Value;
            
            // If sub claim not found, try the nameidentifier claim (used by some providers including Google OAuth)
            if (string.IsNullOrEmpty(auth0Id))
            {
                auth0Id = User.Claims.FirstOrDefault(c => 
                    c.Type == ClaimTypes.NameIdentifier || 
                    c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
                
                Console.WriteLine($"[Stats] Using nameidentifier instead of sub: {auth0Id ?? "NULL"}");
            }
            
            return auth0Id;
        }

        // GET: api/Stats/workout-frequency
        [HttpGet("workout-frequency")]
        public async Task<ActionResult<Dictionary<string, int>>> GetWorkoutFrequency([FromQuery] int days = 30)
        {
            var auth0Id = GetAuth0Id();
            
            if (string.IsNullOrEmpty(auth0Id))
            {
                Console.WriteLine("[Stats] GetWorkoutFrequency - No auth0Id found in token");
                return Unauthorized();
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Auth0Id == auth0Id);
            
            if (user == null)
            {
                Console.WriteLine($"[Stats] GetWorkoutFrequency - User not found for auth0Id: {auth0Id}");
                return Unauthorized();
            }

            var startDate = DateTime.UtcNow.AddDays(-days);
            
            var workoutLogs = await _context.WorkoutLogs
                .Where(wl => wl.UserId == user.Id && wl.WorkoutDate >= startDate)
                .OrderBy(wl => wl.WorkoutDate)
                .ToListAsync();

            var frequencyData = new Dictionary<string, int>();
            
            // Initialize dictionary with all dates in the range
            for (int i = 0; i < days; i++)
            {
                var date = startDate.AddDays(i).Date.ToString("yyyy-MM-dd");
                frequencyData[date] = 0;
            }
            
            // Count workouts per day
            foreach (var log in workoutLogs)
            {
                var date = log.WorkoutDate.ToString("yyyy-MM-dd");
                
                if (frequencyData.ContainsKey(date))
                {
                    frequencyData[date]++;
                }
            }
            
            return frequencyData;
        }

        // GET: api/Stats/workout-duration
        [HttpGet("workout-duration")]
        public async Task<ActionResult<Dictionary<string, double>>> GetWorkoutDuration([FromQuery] int days = 30)
        {
            var auth0Id = GetAuth0Id();
            
            if (string.IsNullOrEmpty(auth0Id))
            {
                Console.WriteLine("[Stats] GetWorkoutDuration - No auth0Id found in token");
                return Unauthorized();
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Auth0Id == auth0Id);
            
            if (user == null)
            {
                Console.WriteLine($"[Stats] GetWorkoutDuration - User not found for auth0Id: {auth0Id}");
                return Unauthorized();
            }

            var startDate = DateTime.UtcNow.AddDays(-days);
            
            var workoutLogs = await _context.WorkoutLogs
                .Where(wl => wl.UserId == user.Id && wl.WorkoutDate >= startDate)
                .OrderBy(wl => wl.WorkoutDate)
                .ToListAsync();

            var durationData = new Dictionary<string, double>();
            
            // Group workouts by day and calculate average duration
            var groupedWorkouts = workoutLogs
                .GroupBy(wl => wl.WorkoutDate.Date)
                .ToDictionary(
                    g => g.Key.ToString("yyyy-MM-dd"),
                    g => g.Average(wl => wl.Duration.TotalMinutes)
                );
                
            // Initialize dictionary with all dates in the range
            for (int i = 0; i < days; i++)
            {
                var date = startDate.AddDays(i).Date.ToString("yyyy-MM-dd");
                durationData[date] = groupedWorkouts.ContainsKey(date) ? groupedWorkouts[date] : 0;
            }
            
            return durationData;
        }

        // GET: api/Stats/goal-progress
        [HttpGet("goal-progress")]
        public async Task<ActionResult<IEnumerable<object>>> GetGoalProgress()
        {
            var auth0Id = GetAuth0Id();
            
            if (string.IsNullOrEmpty(auth0Id))
            {
                Console.WriteLine("[Stats] GetGoalProgress - No auth0Id found in token");
                return Unauthorized();
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Auth0Id == auth0Id);
            
            if (user == null)
            {
                Console.WriteLine($"[Stats] GetGoalProgress - User not found for auth0Id: {auth0Id}");
                return Unauthorized();
            }

            var goals = await _context.Goals
                .Where(g => g.UserId == user.Id && !g.IsCompleted)
                .OrderBy(g => g.TargetDate)
                .Select(g => new {
                    g.Id,
                    g.Name,
                    g.Description,
                    g.TargetValue,
                    g.CurrentValue,
                    g.Unit,
                    g.Type,
                    g.StartDate,
                    g.TargetDate,
                    ProgressPercentage = g.TargetValue > 0 ? 
                        Math.Min(100, Math.Round((g.CurrentValue / g.TargetValue) * 100)) : 0,
                    DaysLeft = (g.TargetDate.Date - DateTime.UtcNow.Date).Days
                })
                .ToListAsync();
                
            return goals;
        }

        // GET: api/Stats/summary
        [HttpGet("summary")]
        public async Task<ActionResult<object>> GetSummary()
        {
            var auth0Id = GetAuth0Id();
            
            if (string.IsNullOrEmpty(auth0Id))
            {
                Console.WriteLine("[Stats] GetSummary - No auth0Id found in token");
                return Unauthorized();
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Auth0Id == auth0Id);
            
            if (user == null)
            {
                Console.WriteLine($"[Stats] GetSummary - User not found for auth0Id: {auth0Id}");
                return Unauthorized();
            }

            var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
            var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);
            
            // Count workouts
            var totalWorkouts = await _context.WorkoutLogs
                .CountAsync(wl => wl.UserId == user.Id);
                
            var workoutsLast30Days = await _context.WorkoutLogs
                .CountAsync(wl => wl.UserId == user.Id && wl.WorkoutDate >= thirtyDaysAgo);
                
            var workoutsLast7Days = await _context.WorkoutLogs
                .CountAsync(wl => wl.UserId == user.Id && wl.WorkoutDate >= sevenDaysAgo);
            
            // Calculate total workout time
            var totalWorkoutMinutes = await _context.WorkoutLogs
                .Where(wl => wl.UserId == user.Id)
                .SumAsync(wl => wl.Duration.TotalMinutes);
                
            var totalWorkoutMinutesLast30Days = await _context.WorkoutLogs
                .Where(wl => wl.UserId == user.Id && wl.WorkoutDate >= thirtyDaysAgo)
                .SumAsync(wl => wl.Duration.TotalMinutes);
                
            // Count completed goals
            var completedGoals = await _context.Goals
                .CountAsync(g => g.UserId == user.Id && g.IsCompleted);
                
            var activeGoals = await _context.Goals
                .CountAsync(g => g.UserId == user.Id && !g.IsCompleted);
            
            // Get most recent workout
            var latestWorkout = await _context.WorkoutLogs
                .Where(wl => wl.UserId == user.Id)
                .OrderByDescending(wl => wl.WorkoutDate)
                .Select(wl => new {
                    wl.Id,
                    wl.WorkoutDate,
                    wl.Duration,
                    ExerciseCount = wl.ExerciseLogs.Count
                })
                .FirstOrDefaultAsync();
                
            // Get upcoming goal
            var upcomingGoal = await _context.Goals
                .Where(g => g.UserId == user.Id && !g.IsCompleted && g.TargetDate > DateTime.UtcNow)
                .OrderBy(g => g.TargetDate)
                .Select(g => new {
                    g.Id,
                    g.Name,
                    g.TargetDate,
                    DaysLeft = (g.TargetDate.Date - DateTime.UtcNow.Date).Days,
                    ProgressPercentage = g.TargetValue > 0 ? 
                        Math.Min(100, Math.Round((g.CurrentValue / g.TargetValue) * 100)) : 0
                })
                .FirstOrDefaultAsync();
                
            return new {
                Workouts = new {
                    Total = totalWorkouts,
                    Last30Days = workoutsLast30Days,
                    Last7Days = workoutsLast7Days
                },
                WorkoutTime = new {
                    TotalMinutes = totalWorkoutMinutes,
                    TotalHours = Math.Round(totalWorkoutMinutes / 60, 1),
                    Last30DaysMinutes = totalWorkoutMinutesLast30Days,
                    Last30DaysHours = Math.Round(totalWorkoutMinutesLast30Days / 60, 1)
                },
                Goals = new {
                    Completed = completedGoals,
                    Active = activeGoals
                },
                LatestWorkout = latestWorkout,
                UpcomingGoal = upcomingGoal
            };
        }

        // GET: api/Stats/exercise-types
        [HttpGet("exercise-types")]
        public async Task<ActionResult<Dictionary<string, int>>> GetExerciseTypes()
        {
            var auth0Id = GetAuth0Id();
            
            if (string.IsNullOrEmpty(auth0Id))
            {
                Console.WriteLine("[Stats] GetExerciseTypes - No auth0Id found in token");
                return Unauthorized();
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Auth0Id == auth0Id);
            
            if (user == null)
            {
                Console.WriteLine($"[Stats] GetExerciseTypes - User not found for auth0Id: {auth0Id}");
                return Unauthorized();
            }

            try
            {
                // Get all exercise logs for this user's workouts
                var exerciseLogs = await _context.WorkoutLogs
                    .Where(wl => wl.UserId == user.Id)
                    .SelectMany(wl => wl.ExerciseLogs)
                    .ToListAsync();
                
                // Get the exercise names and count occurrences
                var exerciseTypes = exerciseLogs
                    .GroupBy(el => el.ExerciseName)
                    .ToDictionary(
                        g => g.Key,
                        g => g.Count()
                    );
                
                // If there's no data, return some default categories
                if (!exerciseTypes.Any())
                {
                    Console.WriteLine("[Stats] No exercise logs found, returning default categories");
                    return new Dictionary<string, int>
                    {
                        { "Strength Training", 0 },
                        { "Cardio", 0 },
                        { "Flexibility", 0 },
                        { "HIIT", 0 }
                    };
                }
                
                return exerciseTypes;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Stats] Error in GetExerciseTypes: {ex.Message}");
                return BadRequest(new { error = ex.Message });
            }
        }

        // GET: api/Stats/muscle-groups
        [HttpGet("muscle-groups")]
        public async Task<ActionResult<Dictionary<string, int>>> GetMuscleGroups()
        {
            var auth0Id = GetAuth0Id();
            
            if (string.IsNullOrEmpty(auth0Id))
            {
                Console.WriteLine("[Stats] GetMuscleGroups - No auth0Id found in token");
                return Unauthorized();
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Auth0Id == auth0Id);
            
            if (user == null)
            {
                Console.WriteLine($"[Stats] GetMuscleGroups - User not found for auth0Id: {auth0Id}");
                return Unauthorized();
            }

            try
            {
                // This is a simplified approach without detailed muscle group data
                // In a real app, you'd need more metadata about each exercise
                
                // Define common exercise keywords to muscle group mapping
                var exerciseToMuscleGroup = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    { "bench", "Chest" },
                    { "press", "Shoulders" },
                    { "chest", "Chest" },
                    { "pec", "Chest" },
                    { "fly", "Chest" },
                    { "pushup", "Chest" },
                    { "push-up", "Chest" },
                    { "squat", "Legs" },
                    { "leg", "Legs" },
                    { "deadlift", "Back" },
                    { "dead lift", "Back" },
                    { "lunge", "Legs" },
                    { "calf", "Legs" },
                    { "shoulder", "Shoulders" },
                    { "delt", "Shoulders" },
                    { "bicep", "Arms" },
                    { "tricep", "Arms" },
                    { "curl", "Arms" },
                    { "extension", "Arms" },
                    { "row", "Back" },
                    { "pull", "Back" },
                    { "lat", "Back" },
                    { "back", "Back" },
                    { "ab", "Core" },
                    { "core", "Core" },
                    { "crunch", "Core" },
                    { "plank", "Core" },
                    { "sit-up", "Core" },
                    { "situp", "Core" }
                };
                
                // Get all exercise logs for this user's workouts
                var exerciseLogs = await _context.WorkoutLogs
                    .Where(wl => wl.UserId == user.Id)
                    .SelectMany(wl => wl.ExerciseLogs)
                    .ToListAsync();
                
                // Initialize muscle group counts
                var muscleGroups = new Dictionary<string, int>
                {
                    { "Chest", 0 },
                    { "Back", 0 },
                    { "Legs", 0 },
                    { "Arms", 0 },
                    { "Shoulders", 0 },
                    { "Core", 0 }
                };
                
                // Count exercises by muscle group based on name keywords
                foreach (var exerciseLog in exerciseLogs)
                {
                    bool matched = false;
                    
                    foreach (var mapping in exerciseToMuscleGroup)
                    {
                        if (exerciseLog.ExerciseName.Contains(mapping.Key, StringComparison.OrdinalIgnoreCase))
                        {
                            muscleGroups[mapping.Value]++;
                            matched = true;
                            break;
                        }
                    }
                    
                    if (!matched)
                    {
                        // Default to "Other" or try to categorize better
                        var muscleGroup = "Other";
                        
                        // If we have an "Other" category, increment it
                        if (muscleGroups.ContainsKey(muscleGroup))
                        {
                            muscleGroups[muscleGroup]++;
                        }
                        // Otherwise, create it
                        else
                        {
                            muscleGroups[muscleGroup] = 1;
                        }
                    }
                }
                
                // Remove categories with zero counts for cleaner charts
                muscleGroups = muscleGroups
                    .Where(mg => mg.Value > 0)
                    .ToDictionary(mg => mg.Key, mg => mg.Value);
                
                // If there's no data at all, keep the defaults
                if (!muscleGroups.Any())
                {
                    Console.WriteLine("[Stats] No muscle group data found, returning default categories");
                }
                
                return muscleGroups;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Stats] Error in GetMuscleGroups: {ex.Message}");
                return BadRequest(new { error = ex.Message });
            }
        }
    }
} 