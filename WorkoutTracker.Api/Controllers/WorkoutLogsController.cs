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
using System.Text.Json.Serialization;

namespace WorkoutTracker.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class WorkoutLogsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public WorkoutLogsController(ApplicationDbContext context)
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
                
                Console.WriteLine($"[WorkoutLogs] Using nameidentifier instead of sub: {auth0Id ?? "NULL"}");
            }
            
            return auth0Id;
        }

        // GET: api/WorkoutLogs
        [HttpGet]
        public async Task<ActionResult<IEnumerable<WorkoutLog>>> GetWorkoutLogs()
        {
            var auth0Id = GetAuth0Id();
            
            if (string.IsNullOrEmpty(auth0Id))
            {
                Console.WriteLine("[WorkoutLogs] GetWorkoutLogs - No auth0Id found in token");
                return Unauthorized();
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Auth0Id == auth0Id);
            
            if (user == null)
            {
                Console.WriteLine($"[WorkoutLogs] GetWorkoutLogs - User not found for auth0Id: {auth0Id}");
                return Unauthorized();
            }

            Console.WriteLine($"[WorkoutLogs] GetWorkoutLogs - Found user with ID: {user.Id}");

            return await _context.WorkoutLogs
                .Where(wl => wl.UserId == user.Id)
                .Include(wl => wl.ExerciseLogs)
                .OrderByDescending(wl => wl.WorkoutDate)
                .ToListAsync();
        }

        // GET: api/WorkoutLogs/5
        [HttpGet("{id}")]
        public async Task<ActionResult<WorkoutLog>> GetWorkoutLog(int id)
        {
            var auth0Id = GetAuth0Id();
            
            if (string.IsNullOrEmpty(auth0Id))
            {
                Console.WriteLine("[WorkoutLogs] GetWorkoutLog - No auth0Id found in token");
                return Unauthorized();
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Auth0Id == auth0Id);
            
            if (user == null)
            {
                Console.WriteLine($"[WorkoutLogs] GetWorkoutLog - User not found for auth0Id: {auth0Id}");
                return Unauthorized();
            }

            var workoutLog = await _context.WorkoutLogs
                .Include(wl => wl.ExerciseLogs)
                .FirstOrDefaultAsync(wl => wl.Id == id && wl.UserId == user.Id);

            if (workoutLog == null)
            {
                return NotFound();
            }

            return workoutLog;
        }

        // POST: api/WorkoutLogs
        [HttpPost]
        public async Task<ActionResult<WorkoutLog>> CreateWorkoutLog([FromBody] object requestData)
        {
            try
            {
                Console.WriteLine($"[WorkoutLogs] CreateWorkoutLog - Received raw request data: {System.Text.Json.JsonSerializer.Serialize(requestData)}");
                
                // Try to extract the workout log from the request data
                WorkoutLog workoutLog;
                try {
                    // First try to deserialize directly
                    workoutLog = System.Text.Json.JsonSerializer.Deserialize<WorkoutLog>(requestData.ToString());
                    
                    Console.WriteLine($"[WorkoutLogs] Deserialized workout log: WorkoutDate={workoutLog?.WorkoutDate}, Duration={(workoutLog?.Duration != null ? workoutLog.Duration.ToString() : "null")}");
                    
                    // If that fails, check if it's wrapped in a 'workoutLog' property
                    if (workoutLog == null || workoutLog.WorkoutDate == default)
                    {
                        Console.WriteLine("[WorkoutLogs] Direct deserialization failed, trying to extract from wrapper");
                        
                        // Use dynamic to access the 'workoutLog' property if it exists
                        dynamic wrapper = System.Text.Json.JsonSerializer.Deserialize<dynamic>(requestData.ToString());
                        if (wrapper.TryGetProperty("workoutLog", out System.Text.Json.JsonElement workoutLogProperty))
                        {
                            Console.WriteLine("[WorkoutLogs] Found 'workoutLog' wrapper, deserializing from it");
                            workoutLog = System.Text.Json.JsonSerializer.Deserialize<WorkoutLog>(workoutLogProperty.ToString());
                            Console.WriteLine($"[WorkoutLogs] Deserialized from wrapper: WorkoutDate={workoutLog?.WorkoutDate}, Duration={(workoutLog?.Duration != null ? workoutLog.Duration.ToString() : "null")}");
                        }

                        // If workout date is still default, try to parse it from the raw data
                        if (workoutLog != null && workoutLog.WorkoutDate == default)
                        {
                            try {
                                // Look for workoutDate property in the wrapper or in the workout log
                                System.Text.Json.JsonElement dateElement;
                                bool foundDate = false;

                                if (wrapper.TryGetProperty("workoutDate", out dateElement) ||
                                    wrapper.TryGetProperty("WorkoutDate", out dateElement) ||
                                    (wrapper.TryGetProperty("workoutLog", out System.Text.Json.JsonElement wl) && 
                                    (wl.TryGetProperty("workoutDate", out dateElement) || 
                                     wl.TryGetProperty("WorkoutDate", out dateElement))) ||
                                    wrapper.TryGetProperty("date", out dateElement))
                                {
                                    foundDate = true;
                                    string dateString = dateElement.GetString();
                                    Console.WriteLine($"[WorkoutLogs] Found date string: {dateString}");
                                    
                                    // Try to parse using various formats
                                    if (DateTime.TryParse(dateString, out DateTime parsedDate))
                                    {
                                        workoutLog.WorkoutDate = parsedDate;
                                        Console.WriteLine($"[WorkoutLogs] Successfully parsed date: {workoutLog.WorkoutDate}");
                                    }
                                    else
                                    {
                                        Console.WriteLine($"[WorkoutLogs] Failed to parse date string: {dateString}");
                                    }
                                }
                                
                                if (!foundDate)
                                {
                                    Console.WriteLine("[WorkoutLogs] Could not find date property in request");
                                }
                            }
                            catch (Exception ex) {
                                Console.WriteLine($"[WorkoutLogs] Error parsing workout date: {ex.Message}");
                            }
                        }
                    }
                    
                    // Look for duration as a separate field
                    if (workoutLog != null && workoutLog.Duration == TimeSpan.Zero)
                    {
                        try {
                            dynamic wrapper = System.Text.Json.JsonSerializer.Deserialize<dynamic>(requestData.ToString());
                            
                            // Try to get duration as a string (HH:MM:SS format)
                            if (wrapper.TryGetProperty("duration", out System.Text.Json.JsonElement durationProperty) ||
                                wrapper.TryGetProperty("Duration", out durationProperty) ||
                                (wrapper.TryGetProperty("workoutLog", out System.Text.Json.JsonElement wl) && 
                                 (wl.TryGetProperty("duration", out durationProperty) || 
                                  wl.TryGetProperty("Duration", out durationProperty))))
                            {
                                if (durationProperty.ValueKind == System.Text.Json.JsonValueKind.String)
                                {
                                    string durationStr = durationProperty.GetString();
                                    Console.WriteLine($"[WorkoutLogs] Found duration string: {durationStr}");
                                    
                                    if (TimeSpan.TryParse(durationStr, out TimeSpan parsedDuration))
                                    {
                                        // Check if it's in HH:MM:SS format but was parsed incorrectly
                                        // This would happen if "00:46:00" is parsed as 46 seconds instead of 46 minutes
                                        if (parsedDuration.TotalMinutes < 1 && durationStr.Contains(":"))
                                        {
                                            string[] parts = durationStr.Split(':');
                                            if (parts.Length >= 3 && int.TryParse(parts[1], out int minutes) && minutes > 0)
                                            {
                                                Console.WriteLine($"[WorkoutLogs] Parsed as {parsedDuration.TotalSeconds} seconds, correcting to {minutes} minutes");
                                                // Override the parsed duration with our corrected interpretation
                                                parsedDuration = TimeSpan.FromMinutes(minutes);
                                            }
                                        }
                                        
                                        workoutLog.Duration = parsedDuration;
                                        Console.WriteLine($"[WorkoutLogs] Set duration to: {workoutLog.Duration} ({workoutLog.Duration.TotalMinutes} minutes)");
                                    }
                                    else if (int.TryParse(durationStr, out int minutes))
                                    {
                                        Console.WriteLine($"[WorkoutLogs] Parsed duration as {minutes} minutes");
                                        workoutLog.Duration = TimeSpan.FromMinutes(minutes);
                                    }
                                    else
                                    {
                                        Console.WriteLine($"[WorkoutLogs] Failed to parse duration string: {durationStr}");
                                    }
                                }
                                else if (durationProperty.ValueKind == System.Text.Json.JsonValueKind.Number)
                                {
                                    int minutes = durationProperty.GetInt32();
                                    Console.WriteLine($"[WorkoutLogs] Found duration in minutes: {minutes}");
                                    workoutLog.Duration = TimeSpan.FromMinutes(minutes);
                                }
                            }
                        }
                        catch (Exception ex) {
                            Console.WriteLine($"[WorkoutLogs] Error extracting duration: {ex.Message}");
                        }
                    }
                }
                catch (Exception ex) {
                    Console.WriteLine($"[WorkoutLogs] Error deserializing workout log: {ex.Message}");
                    return BadRequest(new { 
                        error = "Invalid workout log format", 
                        message = ex.Message,
                        details = "Workout log must include required properties"
                    });
                }
                
                // Validate the workout log has required properties
                if (workoutLog == null)
                {
                    Console.WriteLine("[WorkoutLogs] Validation failed - workout log is null");
                    return BadRequest(new {
                        error = "Missing required fields",
                        message = "No workout log data was provided",
                        details = "Please provide a valid workout log object"
                    });
                }
                
                if (workoutLog.WorkoutDate == default)
                {
                    Console.WriteLine("[WorkoutLogs] Validation failed - WorkoutDate is default/missing");
                    return BadRequest(new {
                        error = "Missing required fields",
                        message = "WorkoutDate is required",
                        details = "Please provide a valid date for the workout"
                    });
                }
                
                // Convert local datetime to UTC if it's not already
                if (workoutLog.WorkoutDate.Kind != DateTimeKind.Utc)
                {
                    Console.WriteLine($"[WorkoutLogs] Converting WorkoutDate from {workoutLog.WorkoutDate.Kind} to UTC");
                    workoutLog.WorkoutDate = DateTime.SpecifyKind(workoutLog.WorkoutDate, DateTimeKind.Utc);
                }
                
                if (workoutLog.Duration <= TimeSpan.Zero)
                {
                    Console.WriteLine($"[WorkoutLogs] Validation failed - Duration is zero or negative: {workoutLog.Duration}");
                    return BadRequest(new {
                        error = "Missing required fields",
                        message = "Duration must be greater than zero",
                        details = "Please provide a positive duration value in minutes"
                    });
                }

                // Set default values for nullable fields
                workoutLog.Notes ??= "Workout";
                
                var auth0Id = GetAuth0Id();
                
                if (string.IsNullOrEmpty(auth0Id))
                {
                    Console.WriteLine("[WorkoutLogs] CreateWorkoutLog - No auth0Id found in token");
                    return Unauthorized();
                }

                var user = await _context.Users.FirstOrDefaultAsync(u => u.Auth0Id == auth0Id);
                
                if (user == null)
                {
                    Console.WriteLine($"[WorkoutLogs] CreateWorkoutLog - User not found for auth0Id: {auth0Id}, creating new user record");
                    
                    // Extract name and email from claims
                    var name = User.Claims.FirstOrDefault(c => c.Type == "name" || c.Type == ClaimTypes.Name)?.Value;
                    var email = User.Claims.FirstOrDefault(c => c.Type == "email" || c.Type == ClaimTypes.Email)?.Value;
                    
                    // Use default values if not found in claims
                    name = !string.IsNullOrEmpty(name) ? name : "User"; 
                    email = !string.IsNullOrEmpty(email) ? email : "user@example.com";
                    
                    Console.WriteLine($"[WorkoutLogs] Creating user with Name: {name}, Email: {email}");
                    
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
                        Console.WriteLine($"[WorkoutLogs] User created successfully with ID: {user.Id}");
                    }
                    catch (Exception ex) {
                        Console.WriteLine($"[WorkoutLogs] Error creating user: {ex.Message}");
                        return BadRequest(new {
                            error = "Failed to create user",
                            message = "Could not create user record",
                            details = ex.Message
                        });
                    }
                }

                // Set the UserId
                workoutLog.UserId = user.Id;
                workoutLog.CreatedAt = DateTime.UtcNow;
                workoutLog.UpdatedAt = DateTime.UtcNow;
                
                // Ensure nullable properties are properly initialized
                if (workoutLog.WorkoutPlanId == 0)
                {
                    workoutLog.WorkoutPlanId = null;
                }
                
                Console.WriteLine($"[WorkoutLogs] Using WorkoutPlanId: {workoutLog.WorkoutPlanId?.ToString() ?? "null"}");
                
                // Check workout plan if provided
                if (workoutLog.WorkoutPlanId.HasValue)
                {
                    var workoutPlan = await _context.WorkoutPlans
                        .FirstOrDefaultAsync(wp => wp.Id == workoutLog.WorkoutPlanId.Value && wp.UserId == user.Id);
                        
                    if (workoutPlan == null)
                    {
                        Console.WriteLine($"[WorkoutLogs] Workout plan with ID {workoutLog.WorkoutPlanId.Value} not found or doesn't belong to the user. Clearing reference.");
                        workoutLog.WorkoutPlanId = null;
                    }
                    else
                    {
                        Console.WriteLine($"[WorkoutLogs] Using valid workout plan with ID {workoutPlan.Id}");
                    }
                }
                
                // Process exercise logs if present
                if (workoutLog.ExerciseLogs == null || workoutLog.ExerciseLogs.Count == 0)
                {
                    // Try to extract exercise logs from the request data
                    try
                    {
                        dynamic wrapper = System.Text.Json.JsonSerializer.Deserialize<dynamic>(requestData.ToString());
                        if (wrapper.TryGetProperty("exerciseLogs", out System.Text.Json.JsonElement exerciseLogsProperty) ||
                            (wrapper.TryGetProperty("workoutLog", out System.Text.Json.JsonElement wl) && 
                             wl.TryGetProperty("exerciseLogs", out exerciseLogsProperty)))
                        {
                            Console.WriteLine("[WorkoutLogs] Found exercise logs in the request data");
                            var exerciseLogs = System.Text.Json.JsonSerializer.Deserialize<List<JsonElement>>(exerciseLogsProperty.ToString());
                            if (exerciseLogs != null && exerciseLogs.Count > 0)
                            {
                                workoutLog.ExerciseLogs = new List<ExerciseLog>();
                                
                                foreach (var exerciseLogData in exerciseLogs)
                                {
                                    try 
                                    {
                                        // Create a new exercise log
                                        var exerciseLog = new ExerciseLog
                                        {
                                            // Do not set WorkoutLogId here, EF Core will handle this
                                            // Set the parent reference instead
                                            WorkoutLog = workoutLog,
                                            
                                            // Ensure required fields have default values
                                            ExerciseName = exerciseLogData.TryGetProperty("exerciseName", out JsonElement nameElement) ? 
                                                nameElement.GetString() ?? "Unnamed Exercise" : "Unnamed Exercise",
                                            Notes = exerciseLogData.TryGetProperty("notes", out JsonElement notesElement) ? 
                                                notesElement.GetString() ?? string.Empty : string.Empty,
                                            
                                            // Parse numerical values with defaults
                                            Sets = exerciseLogData.TryGetProperty("sets", out JsonElement setsElement) ? 
                                                setsElement.GetInt32() : 0,
                                            Reps = exerciseLogData.TryGetProperty("reps", out JsonElement repsElement) ? 
                                                repsElement.GetInt32() : 0,
                                            
                                            // Handle nullable properties
                                            Weight = exerciseLogData.TryGetProperty("weight", out JsonElement weightElement) && 
                                                     weightElement.ValueKind != JsonValueKind.Null ? 
                                                     (decimal?)weightElement.GetDouble() : null,
                                                     
                                            Duration = exerciseLogData.TryGetProperty("duration", out JsonElement durationElement) && 
                                                      durationElement.ValueKind != JsonValueKind.Null && 
                                                      durationElement.ValueKind == JsonValueKind.String && 
                                                      !string.IsNullOrEmpty(durationElement.GetString()) ? 
                                                      TimeSpan.Parse(durationElement.GetString()) : (TimeSpan?)null,
                                            
                                            CreatedAt = DateTime.UtcNow,
                                            UpdatedAt = DateTime.UtcNow
                                        };
                                        
                                        // If we have a date field in the exercise log, convert it to UTC
                                        if (exerciseLogData.TryGetProperty("date", out JsonElement exerciseDateElement) && 
                                            exerciseDateElement.ValueKind != JsonValueKind.Null)
                                        {
                                            try 
                                            {
                                                var dateString = exerciseDateElement.GetString();
                                                if (DateTime.TryParse(dateString, out var exerciseDate)) 
                                                {
                                                    // Ensure it's in UTC
                                                    exerciseDate = DateTime.SpecifyKind(exerciseDate, DateTimeKind.Utc);
                                                    Console.WriteLine($"[WorkoutLogs] Found and parsed exercise date: {exerciseDate}");
                                                }
                                            }
                                            catch (Exception ex)
                                            {
                                                Console.WriteLine($"[WorkoutLogs] Error parsing exercise date: {ex.Message}");
                                            }
                                        }
                                        
                                        Console.WriteLine($"[WorkoutLogs] Created exercise log: {exerciseLog.ExerciseName}, Sets: {exerciseLog.Sets}, Reps: {exerciseLog.Reps}");
                                        
                                        // Check if this is linked to an Exercise in the database
                                        int? exerciseId = null;
                                        if (exerciseLogData.TryGetProperty("exerciseId", out JsonElement exerciseIdElement) && 
                                            exerciseIdElement.ValueKind != JsonValueKind.Null)
                                        {
                                            exerciseId = exerciseIdElement.GetInt32();
                                            
                                            // Verify the exercise exists and belongs to the user
                                            var exercise = await _context.Exercises
                                                .FirstOrDefaultAsync(e => e.Id == exerciseId && 
                                                                    e.WorkoutPlan.UserId == user.Id);
                                                                
                                            if (exercise != null)
                                            {
                                                Console.WriteLine($"[WorkoutLogs] Found matching exercise ID: {exerciseId}");
                                                exerciseLog.ExerciseId = exerciseId;
                                            }
                                            else
                                            {
                                                Console.WriteLine($"[WorkoutLogs] Exercise ID {exerciseId} not found or doesn't belong to user - setting to null");
                                                exerciseLog.ExerciseId = null;
                                            }
                                        }
                                        
                                        // Add to the collection
                                        workoutLog.ExerciseLogs.Add(exerciseLog);
                                    }
                                    catch (Exception ex)
                                    {
                                        Console.WriteLine($"[WorkoutLogs] Error processing exercise log: {ex.Message}");
                                    }
                                }
                                
                                Console.WriteLine($"[WorkoutLogs] Finished processing {workoutLog.ExerciseLogs.Count} exercise logs");
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[WorkoutLogs] Error extracting exercise logs: {ex.Message}");
                        // Continue - exercise logs are optional
                    }
                }
                
                // Ensure we have a valid list (not null) for exercise logs
                workoutLog.ExerciseLogs ??= new List<ExerciseLog>();
                
                // Fix any exercise logs that might not have the proper relation set up
                foreach (var exerciseLog in workoutLog.ExerciseLogs)
                {
                    // These will be set automatically by EF Core when saved
                    exerciseLog.WorkoutLog = workoutLog;
                    
                    // Ensure timestamps
                    exerciseLog.CreatedAt = DateTime.UtcNow;
                    exerciseLog.UpdatedAt = DateTime.UtcNow;
                    
                    // Make sure Notes isn't null to avoid DB issues
                    exerciseLog.Notes ??= string.Empty;
                    exerciseLog.ExerciseName ??= "Unnamed Exercise";
                    
                    Console.WriteLine($"[WorkoutLogs] Preparing to save exercise log: {exerciseLog.ExerciseName}");
                }
                
                try
                {
                    Console.WriteLine("[WorkoutLogs] Attempting to add workout log to database");
                    Console.WriteLine($"[WorkoutLogs] Workout log has {workoutLog.ExerciseLogs.Count} exercise logs");
                    
                    // COMPLETELY REFACTORED SAVE PATTERN:
                    // 1. First extract all exercise logs and remove them from the workout log
                    var exerciseLogsToAdd = workoutLog.ExerciseLogs.ToList();  // Make a copy
                    workoutLog.ExerciseLogs.Clear();  // Clear the collection
                    
                    // 2. Final check - ensure all dates are in UTC format
                    Console.WriteLine($"[WorkoutLogs] WorkoutDate kind before save: {workoutLog.WorkoutDate.Kind}");
                    
                    if (workoutLog.WorkoutDate.Kind != DateTimeKind.Utc)
                    {
                        workoutLog.WorkoutDate = DateTime.SpecifyKind(workoutLog.WorkoutDate, DateTimeKind.Utc);
                        Console.WriteLine($"[WorkoutLogs] Converted WorkoutDate to UTC: {workoutLog.WorkoutDate}");
                    }
                    
                    // 3. Set timestamps
                    workoutLog.CreatedAt = DateTime.UtcNow;
                    workoutLog.UpdatedAt = DateTime.UtcNow;
                    
                    // 4. Save the workout log WITHOUT exercise logs
                    _context.WorkoutLogs.Add(workoutLog);
                    await _context.SaveChangesAsync();
                    Console.WriteLine($"[WorkoutLogs] Successfully saved workout log with ID {workoutLog.Id}");

                    // 5. Now save each exercise log with explicit foreign key
                    if (exerciseLogsToAdd.Any())
                    {
                        Console.WriteLine($"[WorkoutLogs] Now adding {exerciseLogsToAdd.Count} exercise logs");
                        
                        foreach (var exerciseLog in exerciseLogsToAdd)
                        {
                            // Set explicit foreign key
                            exerciseLog.WorkoutLogId = workoutLog.Id;
                            
                            // Clear parent reference to avoid circular references
                            exerciseLog.WorkoutLog = null;
                            
                            // Set timestamps
                            exerciseLog.CreatedAt = DateTime.UtcNow;
                            exerciseLog.UpdatedAt = DateTime.UtcNow;
                            
                            // Ensure required fields
                            exerciseLog.Notes ??= string.Empty;
                            exerciseLog.ExerciseName ??= "Unnamed Exercise";
                            
                            // Add to context
                            _context.ExerciseLogs.Add(exerciseLog);
                            Console.WriteLine($"[WorkoutLogs] Adding exercise log: {exerciseLog.ExerciseName}");
                        }
                        
                        // Save all exercise logs in one batch
                        await _context.SaveChangesAsync();
                        Console.WriteLine($"[WorkoutLogs] Successfully saved {exerciseLogsToAdd.Count} exercise logs");
                    }
                    else
                    {
                        Console.WriteLine("[WorkoutLogs] No exercise logs to save");
                    }

                    // Load the fully saved workout log with all related data to ensure everything is properly initialized
                    var savedWorkoutLog = await _context.WorkoutLogs
                        .Include(wl => wl.ExerciseLogs)
                        .FirstOrDefaultAsync(wl => wl.Id == workoutLog.Id);
                    
                    if (savedWorkoutLog == null)
                    {
                        Console.WriteLine($"[WorkoutLogs] Warning: Could not load saved workout log with ID {workoutLog.Id}");
                        savedWorkoutLog = workoutLog;
                    }
                    
                    // Ensure ExerciseLogs is initialized
                    savedWorkoutLog.ExerciseLogs ??= new List<ExerciseLog>();
                    
                    // Return the created workout log (sanitized to avoid circular references)
                    return CreatedAtAction("GetWorkoutLog", new { id = savedWorkoutLog.Id }, new
                    {
                        savedWorkoutLog.Id,
                        savedWorkoutLog.UserId,
                        savedWorkoutLog.WorkoutDate,
                        savedWorkoutLog.Duration,
                        savedWorkoutLog.Notes,
                        savedWorkoutLog.WorkoutPlanId,
                        ExerciseLogs = savedWorkoutLog.ExerciseLogs.Select(el => new
                        {
                            el.Id,
                            el.ExerciseName,
                            el.Sets,
                            el.Reps,
                            el.Weight,
                            el.Duration,
                            el.Notes
                        }).ToList()
                    });
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[WorkoutLogs] Error saving workout log: {ex.Message}");
                    if (ex.InnerException != null)
                    {
                        Console.WriteLine($"[WorkoutLogs] Inner exception: {ex.InnerException.Message}");
                        Console.WriteLine($"[WorkoutLogs] Inner exception stack trace: {ex.InnerException.StackTrace}");
                    }
                    return StatusCode(500, new 
                    { 
                        error = "Failed to create workout log", 
                        message = "Could not save workout log to database", 
                        details = ex.Message,
                        innerException = ex.InnerException?.Message
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[WorkoutLogs] Unhandled exception in CreateWorkoutLog: {ex.Message}");
                Console.WriteLine($"[WorkoutLogs] Stack trace: {ex.StackTrace}");
                
                return StatusCode(500, new {
                    error = "Server error",
                    message = "An unexpected error occurred while processing your request",
                    details = ex.Message
                });
            }
        }

        // PUT: api/WorkoutLogs/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateWorkoutLog(int id, WorkoutLog workoutLog)
        {
            if (id != workoutLog.Id)
            {
                return BadRequest();
            }

            var auth0Id = GetAuth0Id();
            
            if (string.IsNullOrEmpty(auth0Id))
            {
                Console.WriteLine("[WorkoutLogs] UpdateWorkoutLog - No auth0Id found in token");
                return Unauthorized();
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Auth0Id == auth0Id);
            
            if (user == null)
            {
                Console.WriteLine($"[WorkoutLogs] UpdateWorkoutLog - User not found for auth0Id: {auth0Id}");
                return Unauthorized();
            }

            // Check if the workout log exists and belongs to the user
            var existingWorkoutLog = await _context.WorkoutLogs
                .FirstOrDefaultAsync(wl => wl.Id == id && wl.UserId == user.Id);

            if (existingWorkoutLog == null)
            {
                return NotFound();
            }

            existingWorkoutLog.WorkoutDate = workoutLog.WorkoutDate;
            existingWorkoutLog.Duration = workoutLog.Duration;
            existingWorkoutLog.Notes = workoutLog.Notes;
            existingWorkoutLog.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!WorkoutLogExists(id))
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

        // DELETE: api/WorkoutLogs/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteWorkoutLog(int id)
        {
            var auth0Id = GetAuth0Id();
            
            if (string.IsNullOrEmpty(auth0Id))
            {
                Console.WriteLine("[WorkoutLogs] DeleteWorkoutLog - No auth0Id found in token");
                return Unauthorized();
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Auth0Id == auth0Id);
            
            if (user == null)
            {
                Console.WriteLine($"[WorkoutLogs] DeleteWorkoutLog - User not found for auth0Id: {auth0Id}");
                return Unauthorized();
            }

            var workoutLog = await _context.WorkoutLogs
                .FirstOrDefaultAsync(wl => wl.Id == id && wl.UserId == user.Id);
                
            if (workoutLog == null)
            {
                return NotFound();
            }

            _context.WorkoutLogs.Remove(workoutLog);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/WorkoutLogs/TestSave
        [HttpPost("TestSave")]
        public async Task<ActionResult<WorkoutLog>> TestSaveWorkoutLog()
        {
            try
            {
                Console.WriteLine("[WorkoutLogs] TestSaveWorkoutLog - Creating test workout log with exercise logs");
                
                var auth0Id = GetAuth0Id();
                
                if (string.IsNullOrEmpty(auth0Id))
                {
                    Console.WriteLine("[WorkoutLogs] TestSaveWorkoutLog - No auth0Id found in token");
                    return Unauthorized();
                }

                var user = await _context.Users.FirstOrDefaultAsync(u => u.Auth0Id == auth0Id);
                
                if (user == null)
                {
                    Console.WriteLine($"[WorkoutLogs] TestSaveWorkoutLog - User not found for auth0Id: {auth0Id}");
                    return Unauthorized();
                }

                Console.WriteLine($"[WorkoutLogs] TestSaveWorkoutLog - Found user with ID: {user.Id}");
                
                // Step 1: Create and save the workout log first
                var workoutLog = new WorkoutLog
                {
                    UserId = user.Id,
                    WorkoutDate = DateTime.UtcNow,
                    Duration = TimeSpan.FromMinutes(45),
                    Notes = "Test Workout Log",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                
                Console.WriteLine("[WorkoutLogs] TestSaveWorkoutLog - Adding workout log to context");
                _context.WorkoutLogs.Add(workoutLog);
                await _context.SaveChangesAsync();
                Console.WriteLine($"[WorkoutLogs] TestSaveWorkoutLog - Saved workout log with ID: {workoutLog.Id}");
                
                // Step 2: Create and save exercise logs directly with the workout log ID
                var exerciseLog1 = new ExerciseLog
                {
                    WorkoutLogId = workoutLog.Id,  // Directly set the foreign key
                    ExerciseName = "Test Exercise 1",
                    Sets = 3,
                    Reps = 10,
                    Notes = "Test Notes 1",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                
                var exerciseLog2 = new ExerciseLog
                {
                    WorkoutLogId = workoutLog.Id,  // Directly set the foreign key
                    ExerciseName = "Test Exercise 2",
                    Sets = 4,
                    Reps = 12,
                    Notes = "Test Notes 2",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                
                Console.WriteLine("[WorkoutLogs] TestSaveWorkoutLog - Adding exercise logs to context");
                _context.ExerciseLogs.Add(exerciseLog1);
                _context.ExerciseLogs.Add(exerciseLog2);
                await _context.SaveChangesAsync();
                Console.WriteLine("[WorkoutLogs] TestSaveWorkoutLog - Saved exercise logs");
                
                // Step 3: Verify that the exercise logs were properly saved
                var savedWorkoutLog = await _context.WorkoutLogs
                    .Include(wl => wl.ExerciseLogs)
                    .FirstOrDefaultAsync(wl => wl.Id == workoutLog.Id);
                
                if (savedWorkoutLog == null)
                {
                    Console.WriteLine("[WorkoutLogs] TestSaveWorkoutLog - ERROR: Could not retrieve saved workout log");
                    return StatusCode(500, new { error = "Failed to retrieve saved workout log" });
                }
                
                Console.WriteLine($"[WorkoutLogs] TestSaveWorkoutLog - Retrieved workout log with {savedWorkoutLog.ExerciseLogs.Count} exercise logs");
                
                // Return the workout log with its exercise logs
                return Ok(new
                {
                    workoutLog = new
                    {
                        savedWorkoutLog.Id,
                        savedWorkoutLog.UserId,
                        savedWorkoutLog.WorkoutDate,
                        savedWorkoutLog.Duration,
                        savedWorkoutLog.Notes,
                        ExerciseLogs = savedWorkoutLog.ExerciseLogs.Select(el => new
                        {
                            el.Id,
                            el.ExerciseName,
                            el.Sets,
                            el.Reps,
                            el.Notes
                        }).ToList()
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[WorkoutLogs] TestSaveWorkoutLog - ERROR: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"[WorkoutLogs] TestSaveWorkoutLog - Inner exception: {ex.InnerException.Message}");
                }
                Console.WriteLine($"[WorkoutLogs] TestSaveWorkoutLog - Stack trace: {ex.StackTrace}");
                
                return StatusCode(500, new
                {
                    error = "Failed to save test data",
                    message = ex.Message,
                    innerException = ex.InnerException?.Message
                });
            }
        }

        private bool WorkoutLogExists(int id)
        {
            return _context.WorkoutLogs.Any(e => e.Id == id);
        }
    }
} 