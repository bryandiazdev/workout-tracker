using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using WorkoutTracker.Api.Data;
using WorkoutTracker.Api.Models;

namespace WorkoutTracker.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DiagnosticsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DiagnosticsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Diagnostics/DbTest
        [HttpGet("DbTest")]
        public async Task<ActionResult<string>> TestDatabaseConnection()
        {
            try
            {
                // Test basic query
                var userCount = await _context.Users.CountAsync();
                var workoutLogCount = await _context.WorkoutLogs.CountAsync();
                var workoutPlanCount = await _context.WorkoutPlans.CountAsync();
                var exerciseLogCount = await _context.ExerciseLogs.CountAsync();
                var exerciseCount = await _context.Exercises.CountAsync();

                return Ok(new
                {
                    message = "Database connection successful",
                    status = "OK",
                    counts = new
                    {
                        users = userCount,
                        workoutLogs = workoutLogCount,
                        workoutPlans = workoutPlanCount,
                        exerciseLogs = exerciseLogCount,
                        exercises = exerciseCount
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Database connection error",
                    error = ex.Message,
                    innerError = ex.InnerException?.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }

        // POST: api/Diagnostics/DirectSave
        [HttpPost("DirectSave")]
        public async Task<ActionResult<string>> DirectSaveTest()
        {
            try
            {
                // Step 1: Get the first user in the system (or create one if none exists)
                var user = await _context.Users.FirstOrDefaultAsync();
                if (user == null)
                {
                    user = new User
                    {
                        Auth0Id = "direct-test-user",
                        Name = "Test User",
                        Email = "test@example.com",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.Users.Add(user);
                    await _context.SaveChangesAsync();
                    Console.WriteLine("[Diagnostics] Created test user with ID: " + user.Id);
                }
                else
                {
                    Console.WriteLine("[Diagnostics] Using existing user with ID: " + user.Id);
                }

                // Step 2: Create a very simple workout log
                var workoutLog = new WorkoutLog
                {
                    UserId = user.Id,
                    WorkoutDate = DateTime.UtcNow,
                    Duration = TimeSpan.FromMinutes(30),
                    Notes = "Diagnostic Test Workout",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                // Step 3: Save the workout log
                _context.WorkoutLogs.Add(workoutLog);
                await _context.SaveChangesAsync();
                Console.WriteLine("[Diagnostics] Created workout log with ID: " + workoutLog.Id);

                // Step 4: Create exercise logs
                var exerciseLog = new ExerciseLog
                {
                    WorkoutLogId = workoutLog.Id,
                    ExerciseName = "Test Exercise",
                    Sets = 3,
                    Reps = 10,
                    Notes = "Diagnostic Test",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                // Step 5: Save the exercise log
                _context.ExerciseLogs.Add(exerciseLog);
                await _context.SaveChangesAsync();
                Console.WriteLine("[Diagnostics] Created exercise log with ID: " + exerciseLog.Id);

                // Step 6: Create a simple workout plan
                var workoutPlan = new WorkoutPlan
                {
                    UserId = user.Id,
                    Name = "Test Workout Plan",
                    Description = "Diagnostic Test Plan",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                // Step 7: Save the workout plan
                _context.WorkoutPlans.Add(workoutPlan);
                await _context.SaveChangesAsync();
                Console.WriteLine("[Diagnostics] Created workout plan with ID: " + workoutPlan.Id);

                // Step 8: Create exercise
                var exercise = new Exercise
                {
                    WorkoutPlanId = workoutPlan.Id,
                    Name = "Test Plan Exercise",
                    Description = "Diagnostic Test",
                    Sets = 3,
                    Reps = 10,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                // Step 9: Save the exercise
                _context.Exercises.Add(exercise);
                await _context.SaveChangesAsync();
                Console.WriteLine("[Diagnostics] Created exercise with ID: " + exercise.Id);

                // Step 10: Verify the data was actually saved
                var savedWorkoutLog = await _context.WorkoutLogs
                    .Include(wl => wl.ExerciseLogs)
                    .FirstOrDefaultAsync(wl => wl.Id == workoutLog.Id);

                var savedWorkoutPlan = await _context.WorkoutPlans
                    .Include(wp => wp.Exercises)
                    .FirstOrDefaultAsync(wp => wp.Id == workoutPlan.Id);

                if (savedWorkoutLog == null || savedWorkoutLog.ExerciseLogs.Count == 0)
                {
                    return StatusCode(500, new
                    {
                        message = "Workout log or exercise logs were not properly saved to database",
                        workoutLogId = workoutLog.Id,
                        exerciseLogId = exerciseLog.Id
                    });
                }

                if (savedWorkoutPlan == null || savedWorkoutPlan.Exercises.Count == 0)
                {
                    return StatusCode(500, new
                    {
                        message = "Workout plan or exercises were not properly saved to database",
                        workoutPlanId = workoutPlan.Id,
                        exerciseId = exercise.Id
                    });
                }

                return Ok(new
                {
                    message = "Direct save successful",
                    status = "OK",
                    data = new
                    {
                        workoutLog = new
                        {
                            id = workoutLog.Id,
                            userId = workoutLog.UserId,
                            exerciseLogs = savedWorkoutLog.ExerciseLogs.Count
                        },
                        workoutPlan = new
                        {
                            id = workoutPlan.Id,
                            userId = workoutPlan.UserId,
                            exercises = savedWorkoutPlan.Exercises.Count
                        }
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Error performing direct save",
                    error = ex.Message,
                    innerError = ex.InnerException?.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }
    }
} 