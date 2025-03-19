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
using System.Text.Json;
using System.Text.Json.Nodes;

namespace WorkoutTracker.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class WorkoutPlansController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public WorkoutPlansController(ApplicationDbContext context)
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
                
                Console.WriteLine($"[WorkoutPlans] Using nameidentifier instead of sub: {auth0Id ?? "NULL"}");
            }
            
            return auth0Id;
        }

        // GET: api/WorkoutPlans
        [HttpGet]
        public async Task<ActionResult<IEnumerable<WorkoutPlan>>> GetWorkoutPlans()
        {
            var auth0Id = GetAuth0Id();
            
            if (string.IsNullOrEmpty(auth0Id))
            {
                Console.WriteLine("[WorkoutPlans] GetWorkoutPlans - No auth0Id found in token");
                return Unauthorized();
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Auth0Id == auth0Id);
            
            if (user == null)
            {
                Console.WriteLine($"[WorkoutPlans] GetWorkoutPlans - User not found for auth0Id: {auth0Id}");
                return Unauthorized();
            }

            Console.WriteLine($"[WorkoutPlans] GetWorkoutPlans - Found user with ID: {user.Id}");

            return await _context.WorkoutPlans
                .Where(wp => wp.UserId == user.Id)
                .Include(wp => wp.Exercises)
                .ToListAsync();
        }

        // GET: api/WorkoutPlans/5
        [HttpGet("{id}")]
        public async Task<ActionResult<WorkoutPlan>> GetWorkoutPlan(int id)
        {
            var auth0Id = GetAuth0Id();
            
            if (string.IsNullOrEmpty(auth0Id))
            {
                Console.WriteLine("[WorkoutPlans] GetWorkoutPlan - No auth0Id found in token");
                return Unauthorized();
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Auth0Id == auth0Id);
            
            if (user == null)
            {
                Console.WriteLine($"[WorkoutPlans] GetWorkoutPlan - User not found for auth0Id: {auth0Id}");
                return Unauthorized();
            }

            var workoutPlan = await _context.WorkoutPlans
                .Include(wp => wp.Exercises)
                .FirstOrDefaultAsync(wp => wp.Id == id && wp.UserId == user.Id);

            if (workoutPlan == null)
            {
                return NotFound();
            }

            return workoutPlan;
        }

        // POST: api/WorkoutPlans
        [HttpPost]
        public async Task<ActionResult<WorkoutPlan>> CreateWorkoutPlan([FromBody] object requestData)
        {
            try
            {
                Console.WriteLine($"[WorkoutPlans] CreateWorkoutPlan - Received raw request data: {System.Text.Json.JsonSerializer.Serialize(requestData)}");
                
                // Try to extract the workout plan from the request data
                WorkoutPlan workoutPlan;
                try {
                    // First try to deserialize directly
                    workoutPlan = System.Text.Json.JsonSerializer.Deserialize<WorkoutPlan>(requestData.ToString());
                    
                    // If that fails, check if it's wrapped in a 'workoutPlan' property
                    if (workoutPlan == null || string.IsNullOrEmpty(workoutPlan.Name))
                    {
                        Console.WriteLine("[WorkoutPlans] Direct deserialization failed, trying to extract from wrapper");
                        
                        // Use dynamic to access the 'workoutPlan' property if it exists
                        dynamic wrapper = System.Text.Json.JsonSerializer.Deserialize<dynamic>(requestData.ToString());
                        if (wrapper.TryGetProperty("workoutPlan", out System.Text.Json.JsonElement workoutPlanProperty))
                        {
                            Console.WriteLine("[WorkoutPlans] Found 'workoutPlan' wrapper, deserializing from it");
                            workoutPlan = System.Text.Json.JsonSerializer.Deserialize<WorkoutPlan>(workoutPlanProperty.ToString());
                        }
                    }
                }
                catch (Exception ex) {
                    Console.WriteLine($"[WorkoutPlans] Error deserializing workout plan: {ex.Message}");
                    return BadRequest(new { 
                        error = "Invalid workout plan format", 
                        message = ex.Message,
                        details = "Workout plan must include Name and Description properties"
                    });
                }
                
                // Validate the workout plan has required properties
                if (workoutPlan == null || string.IsNullOrEmpty(workoutPlan.Name))
                {
                    Console.WriteLine("[WorkoutPlans] Validation failed - missing required properties");
                    return BadRequest(new {
                        error = "Missing required fields",
                        message = "Workout plan must include Name property"
                    });
                }

                // Set default values for nullable fields
                workoutPlan.Description ??= "Workout Plan";
                
                var auth0Id = GetAuth0Id();
                
                if (string.IsNullOrEmpty(auth0Id))
                {
                    Console.WriteLine("[WorkoutPlans] CreateWorkoutPlan - No auth0Id found in token");
                    return Unauthorized();
                }

                var user = await _context.Users.FirstOrDefaultAsync(u => u.Auth0Id == auth0Id);
                
                if (user == null)
                {
                    Console.WriteLine($"[WorkoutPlans] CreateWorkoutPlan - User not found for auth0Id: {auth0Id}, creating new user record");
                    
                    // Extract name and email from claims
                    var name = User.Claims.FirstOrDefault(c => c.Type == "name" || c.Type == ClaimTypes.Name)?.Value;
                    var email = User.Claims.FirstOrDefault(c => c.Type == "email" || c.Type == ClaimTypes.Email)?.Value;
                    
                    // Use default values if not found in claims
                    name = !string.IsNullOrEmpty(name) ? name : "User"; 
                    email = !string.IsNullOrEmpty(email) ? email : "user@example.com";
                    
                    Console.WriteLine($"[WorkoutPlans] Creating user with Name: {name}, Email: {email}");
                    
                    // Create the user
                    user = new User
                    {
                        Auth0Id = auth0Id,
                        Name = name,
                        Email = email,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    
                    _context.Users.Add(user);
                    
                    // Save the user first
                    try {
                        await _context.SaveChangesAsync();
                        Console.WriteLine($"[WorkoutPlans] User created successfully with ID: {user.Id}");
                    }
                    catch (Exception ex) {
                        Console.WriteLine($"[WorkoutPlans] Error creating user: {ex.Message}");
                        return BadRequest(new {
                            error = "Failed to create user",
                            message = "Could not create user record",
                            details = ex.Message
                        });
                    }
                }

                workoutPlan.UserId = user.Id;
                
                // Ensure all DateTime values are in UTC
                workoutPlan.CreatedAt = DateTime.UtcNow;
                workoutPlan.UpdatedAt = DateTime.UtcNow;
                
                Console.WriteLine($"[WorkoutPlans] Set CreatedAt to UTC: {workoutPlan.CreatedAt}");
                
                // Process exercises if they were included
                if (workoutPlan.Exercises == null || !workoutPlan.Exercises.Any())
                {
                    // Try to extract exercises from the request data
                    try
                    {
                        dynamic wrapper = System.Text.Json.JsonSerializer.Deserialize<dynamic>(requestData.ToString());
                        if (wrapper.TryGetProperty("exercises", out System.Text.Json.JsonElement exercisesProperty) ||
                            (wrapper.TryGetProperty("workoutPlan", out System.Text.Json.JsonElement wp) && 
                             wp.TryGetProperty("exercises", out exercisesProperty)))
                        {
                            Console.WriteLine("[WorkoutPlans] Found exercises in the request data");
                            
                            try {
                                var exercises = System.Text.Json.JsonSerializer.Deserialize<List<Exercise>>(exercisesProperty.ToString());
                                if (exercises != null && exercises.Any())
                                {
                                    workoutPlan.Exercises = exercises;
                                    Console.WriteLine($"[WorkoutPlans] Successfully deserialized {exercises.Count} exercises");
                                }
                            }
                            catch (Exception ex) {
                                Console.WriteLine($"[WorkoutPlans] Error deserializing exercises: {ex.Message}");
                                
                                // Try to parse as JsonElements and convert manually
                                try {
                                    var exerciseElements = System.Text.Json.JsonSerializer.Deserialize<List<JsonElement>>(exercisesProperty.ToString());
                                    if (exerciseElements != null && exerciseElements.Any())
                                    {
                                        Console.WriteLine($"[WorkoutPlans] Trying to parse {exerciseElements.Count} exercise elements manually");
                                        
                                        workoutPlan.Exercises = new List<Exercise>();
                                        
                                        foreach (var element in exerciseElements)
                                        {
                                            try {
                                                var exercise = new Exercise {
                                                    Name = element.TryGetProperty("name", out var nameElement) ? 
                                                        nameElement.GetString() ?? "Exercise" : "Exercise",
                                                        
                                                    Description = element.TryGetProperty("description", out var descElement) ? 
                                                        descElement.GetString() ?? "" : "",
                                                        
                                                    Sets = element.TryGetProperty("sets", out var setsElement) && 
                                                           setsElement.ValueKind == JsonValueKind.Number ? 
                                                           setsElement.GetInt32() : 0,
                                                           
                                                    Reps = element.TryGetProperty("reps", out var repsElement) && 
                                                           repsElement.ValueKind == JsonValueKind.Number ? 
                                                           repsElement.GetInt32() : 0,
                                                           
                                                    Weight = element.TryGetProperty("weight", out var weightElement) && 
                                                            weightElement.ValueKind == JsonValueKind.Number ? 
                                                            (decimal?)weightElement.GetDouble() : null,
                                                            
                                                    Duration = element.TryGetProperty("duration", out var durationElement) && 
                                                              durationElement.ValueKind == JsonValueKind.String ? 
                                                              TimeSpan.Parse(durationElement.GetString()) : (TimeSpan?)null,
                                                              
                                                    CreatedAt = DateTime.UtcNow,
                                                    UpdatedAt = DateTime.UtcNow,
                                                    WorkoutPlan = workoutPlan // Set the parent reference
                                                };
                                                
                                                workoutPlan.Exercises.Add(exercise);
                                                Console.WriteLine($"[WorkoutPlans] Successfully parsed exercise: {exercise.Name}");
                                            }
                                            catch (Exception parseEx) {
                                                Console.WriteLine($"[WorkoutPlans] Error parsing individual exercise: {parseEx.Message}");
                                            }
                                        }
                                        
                                        Console.WriteLine($"[WorkoutPlans] Successfully parsed {workoutPlan.Exercises.Count} exercises manually");
                                    }
                                }
                                catch (Exception manualEx) {
                                    Console.WriteLine($"[WorkoutPlans] Error manually parsing exercises: {manualEx.Message}");
                                }
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[WorkoutPlans] Error extracting exercises: {ex.Message}");
                        // Continue - exercises are optional
                    }
                }
                
                // Process exercises if they exist
                if (workoutPlan.Exercises != null && workoutPlan.Exercises.Any())
                {
                    foreach (var exercise in workoutPlan.Exercises)
                    {
                        // Set required fields if not provided
                        exercise.Name ??= "Exercise";
                        exercise.Description ??= "";
                        
                        // Set the parent reference explicitly 
                        exercise.WorkoutPlan = workoutPlan;
                        
                        exercise.CreatedAt = DateTime.UtcNow;
                        exercise.UpdatedAt = DateTime.UtcNow;
                        
                        Console.WriteLine($"[WorkoutPlans] Preparing to save exercise: {exercise.Name}");
                    }
                }
                else 
                {
                    // Initialize empty collection to avoid null reference
                    workoutPlan.Exercises = new List<Exercise>();
                }
                
                Console.WriteLine($"[WorkoutPlans] Workout plan has {workoutPlan.Exercises.Count} exercises to save");
                
                try {
                    // COMPLETELY REFACTORED SAVE PATTERN:
                    // 1. First extract all exercises and remove them from the workout plan
                    var exercisesToAdd = workoutPlan.Exercises.ToList();  // Make a copy
                    workoutPlan.Exercises.Clear();  // Clear the collection
                    
                    // 2. Set timestamps
                    workoutPlan.CreatedAt = DateTime.UtcNow;
                    workoutPlan.UpdatedAt = DateTime.UtcNow;
                    
                    // 3. Save the workout plan WITHOUT exercises
                    _context.WorkoutPlans.Add(workoutPlan);
                    await _context.SaveChangesAsync();
                    Console.WriteLine($"[WorkoutPlans] CreateWorkoutPlan - Successfully created workout plan with ID: {workoutPlan.Id}");
                    
                    // 4. Now save each exercise with explicit foreign key
                    if (exercisesToAdd.Any())
                    {
                        Console.WriteLine($"[WorkoutPlans] Now adding {exercisesToAdd.Count} exercises");
                        
                        foreach (var exercise in exercisesToAdd)
                        {
                            // Set explicit foreign key
                            exercise.WorkoutPlanId = workoutPlan.Id;
                            
                            // Clear parent reference to avoid circular references
                            exercise.WorkoutPlan = null;
                            
                            // Set timestamps
                            exercise.CreatedAt = DateTime.UtcNow;
                            exercise.UpdatedAt = DateTime.UtcNow;
                            
                            // Ensure required fields
                            exercise.Name ??= "Exercise";
                            exercise.Description ??= "";
                            
                            // Add to context
                            _context.Exercises.Add(exercise);
                            Console.WriteLine($"[WorkoutPlans] Adding exercise: {exercise.Name}");
                        }
                        
                        // Save all exercises in one batch
                        await _context.SaveChangesAsync();
                        Console.WriteLine($"[WorkoutPlans] Successfully saved {exercisesToAdd.Count} exercises");
                    }
                    else
                    {
                        Console.WriteLine("[WorkoutPlans] No exercises to save");
                    }
                    
                    // Load the saved workout plan with all related data
                    var savedWorkoutPlan = await _context.WorkoutPlans
                        .Include(wp => wp.Exercises)
                        .FirstOrDefaultAsync(wp => wp.Id == workoutPlan.Id);
                        
                    if (savedWorkoutPlan == null)
                    {
                        Console.WriteLine($"[WorkoutPlans] Warning: Could not load saved workout plan with ID {workoutPlan.Id}");
                        savedWorkoutPlan = workoutPlan;
                    }
                    
                    // Ensure Exercises is initialized
                    savedWorkoutPlan.Exercises ??= new List<Exercise>();
                    
                    // Return a sanitized version without circular references
                    return CreatedAtAction(nameof(GetWorkoutPlan), new { id = savedWorkoutPlan.Id }, new {
                        savedWorkoutPlan.Id,
                        savedWorkoutPlan.Name,
                        savedWorkoutPlan.Description,
                        savedWorkoutPlan.CreatedAt,
                        savedWorkoutPlan.UpdatedAt,
                        Exercises = savedWorkoutPlan.Exercises.Select(e => new {
                            e.Id,
                            e.Name,
                            e.Description,
                            e.Sets,
                            e.Reps,
                            e.Weight,
                            e.Duration
                        }).ToList()
                    });
                }
                catch (Exception ex) {
                    Console.WriteLine($"[WorkoutPlans] Error creating workout plan: {ex.Message}");
                    Console.WriteLine($"[WorkoutPlans] Stack trace: {ex.StackTrace}");
                    
                    if (ex.InnerException != null)
                    {
                        Console.WriteLine($"[WorkoutPlans] Inner exception: {ex.InnerException.Message}");
                        Console.WriteLine($"[WorkoutPlans] Inner exception stack trace: {ex.InnerException.StackTrace}");
                    }
                    
                    return StatusCode(500, new {
                        error = "Failed to create workout plan",
                        message = "Could not save workout plan to database",
                        details = ex.Message,
                        innerException = ex.InnerException?.Message
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[WorkoutPlans] Unhandled exception in CreateWorkoutPlan: {ex.Message}");
                Console.WriteLine($"[WorkoutPlans] Stack trace: {ex.StackTrace}");
                
                return StatusCode(500, new {
                    error = "Server error",
                    message = "An unexpected error occurred while processing your request",
                    details = ex.Message
                });
            }
        }

        // PUT: api/WorkoutPlans/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateWorkoutPlan(int id, WorkoutPlan workoutPlan)
        {
            if (id != workoutPlan.Id)
            {
                return BadRequest();
            }

            var auth0Id = GetAuth0Id();
            
            if (string.IsNullOrEmpty(auth0Id))
            {
                Console.WriteLine("[WorkoutPlans] UpdateWorkoutPlan - No auth0Id found in token");
                return Unauthorized();
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Auth0Id == auth0Id);
            
            if (user == null)
            {
                Console.WriteLine($"[WorkoutPlans] UpdateWorkoutPlan - User not found for auth0Id: {auth0Id}");
                return Unauthorized();
            }

            var existingWorkoutPlan = await _context.WorkoutPlans
                .FirstOrDefaultAsync(wp => wp.Id == id && wp.UserId == user.Id);

            if (existingWorkoutPlan == null)
            {
                return NotFound();
            }

            existingWorkoutPlan.Name = workoutPlan.Name;
            existingWorkoutPlan.Description = workoutPlan.Description;
            existingWorkoutPlan.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!WorkoutPlanExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/WorkoutPlans/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteWorkoutPlan(int id)
        {
            var auth0Id = GetAuth0Id();
            
            if (string.IsNullOrEmpty(auth0Id))
            {
                Console.WriteLine("[WorkoutPlans] DeleteWorkoutPlan - No auth0Id found in token");
                return Unauthorized();
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Auth0Id == auth0Id);
            
            if (user == null)
            {
                Console.WriteLine($"[WorkoutPlans] DeleteWorkoutPlan - User not found for auth0Id: {auth0Id}");
                return Unauthorized();
            }

            var workoutPlan = await _context.WorkoutPlans
                .FirstOrDefaultAsync(wp => wp.Id == id && wp.UserId == user.Id);
                
            if (workoutPlan == null)
            {
                return NotFound();
            }

            _context.WorkoutPlans.Remove(workoutPlan);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/WorkoutPlans/TestSave
        [HttpPost("TestSave")]
        public async Task<ActionResult<WorkoutPlan>> TestSaveWorkoutPlan()
        {
            try
            {
                Console.WriteLine("[WorkoutPlans] TestSaveWorkoutPlan - Creating test workout plan with exercises");
                
                var auth0Id = GetAuth0Id();
                
                if (string.IsNullOrEmpty(auth0Id))
                {
                    Console.WriteLine("[WorkoutPlans] TestSaveWorkoutPlan - No auth0Id found in token");
                    return Unauthorized();
                }

                var user = await _context.Users.FirstOrDefaultAsync(u => u.Auth0Id == auth0Id);
                
                if (user == null)
                {
                    Console.WriteLine($"[WorkoutPlans] TestSaveWorkoutPlan - User not found for auth0Id: {auth0Id}");
                    return Unauthorized();
                }

                Console.WriteLine($"[WorkoutPlans] TestSaveWorkoutPlan - Found user with ID: {user.Id}");
                
                // Step 1: Create and save the workout plan first
                var workoutPlan = new WorkoutPlan
                {
                    UserId = user.Id,
                    Name = "Test Workout Plan",
                    Description = "Test Description",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                
                Console.WriteLine("[WorkoutPlans] TestSaveWorkoutPlan - Adding workout plan to context");
                _context.WorkoutPlans.Add(workoutPlan);
                await _context.SaveChangesAsync();
                Console.WriteLine($"[WorkoutPlans] TestSaveWorkoutPlan - Saved workout plan with ID: {workoutPlan.Id}");
                
                // Step 2: Create and save exercises directly with the workout plan ID
                var exercise1 = new Exercise
                {
                    WorkoutPlanId = workoutPlan.Id,  // Directly set the foreign key
                    Name = "Test Exercise 1",
                    Description = "Test Description 1",
                    Sets = 3,
                    Reps = 10,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                
                var exercise2 = new Exercise
                {
                    WorkoutPlanId = workoutPlan.Id,  // Directly set the foreign key
                    Name = "Test Exercise 2",
                    Description = "Test Description 2",
                    Sets = 4,
                    Reps = 12,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                
                Console.WriteLine("[WorkoutPlans] TestSaveWorkoutPlan - Adding exercises to context");
                _context.Exercises.Add(exercise1);
                _context.Exercises.Add(exercise2);
                await _context.SaveChangesAsync();
                Console.WriteLine("[WorkoutPlans] TestSaveWorkoutPlan - Saved exercises");
                
                // Step 3: Verify that the exercises were properly saved
                var savedWorkoutPlan = await _context.WorkoutPlans
                    .Include(wp => wp.Exercises)
                    .FirstOrDefaultAsync(wp => wp.Id == workoutPlan.Id);
                
                if (savedWorkoutPlan == null)
                {
                    Console.WriteLine("[WorkoutPlans] TestSaveWorkoutPlan - ERROR: Could not retrieve saved workout plan");
                    return StatusCode(500, new { error = "Failed to retrieve saved workout plan" });
                }
                
                Console.WriteLine($"[WorkoutPlans] TestSaveWorkoutPlan - Retrieved workout plan with {savedWorkoutPlan.Exercises.Count} exercises");
                
                // Return the workout plan with its exercises
                return Ok(new
                {
                    workoutPlan = new
                    {
                        savedWorkoutPlan.Id,
                        savedWorkoutPlan.UserId,
                        savedWorkoutPlan.Name,
                        savedWorkoutPlan.Description,
                        Exercises = savedWorkoutPlan.Exercises.Select(e => new
                        {
                            e.Id,
                            e.Name,
                            e.Description,
                            e.Sets,
                            e.Reps
                        }).ToList()
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[WorkoutPlans] TestSaveWorkoutPlan - ERROR: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"[WorkoutPlans] TestSaveWorkoutPlan - Inner exception: {ex.InnerException.Message}");
                }
                Console.WriteLine($"[WorkoutPlans] TestSaveWorkoutPlan - Stack trace: {ex.StackTrace}");
                
                return StatusCode(500, new
                {
                    error = "Failed to save test data",
                    message = ex.Message,
                    innerException = ex.InnerException?.Message
                });
            }
        }

        private bool WorkoutPlanExists(int id)
        {
            return _context.WorkoutPlans.Any(e => e.Id == id);
        }
    }
} 