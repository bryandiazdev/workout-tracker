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
    public class GoalsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public GoalsController(ApplicationDbContext context)
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
                
                Console.WriteLine($"[Goals] Using nameidentifier instead of sub: {auth0Id ?? "NULL"}");
            }
            
            return auth0Id;
        }

        // GET: api/Goals
        [HttpGet]
        public async Task<IActionResult> GetGoals()
        {
            var auth0Id = GetAuth0Id();
            
            if (string.IsNullOrEmpty(auth0Id))
            {
                Console.WriteLine("[Goals] GetGoals - No auth0Id found in token");
                return Unauthorized();
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Auth0Id == auth0Id);
            
            if (user == null)
            {
                Console.WriteLine($"[Goals] GetGoals - User not found for auth0Id: {auth0Id}");
                return Unauthorized();
            }

            Console.WriteLine($"[Goals] GetGoals - Found user with ID: {user.Id}");
            
            var goals = await _context.Goals
                .Where(g => g.UserId == user.Id)
                .OrderBy(g => g.IsCompleted)
                .ThenBy(g => g.TargetDate)
                .ToListAsync();
                
            // Return sanitized goals without circular references
            var sanitizedGoals = goals.Select(goal => new
            {
                goal.Id,
                goal.Name,
                goal.Description,
                goal.StartDate,
                goal.TargetDate,
                goal.TargetValue,
                goal.Type,
                goal.Unit,
                goal.IsCompleted,
                goal.CompletedDate,
                goal.CreatedAt,
                goal.UpdatedAt,
                UserId = goal.UserId,
                goal.CurrentValue
            }).ToList();
            
            return Ok(sanitizedGoals);
        }

        // GET: api/Goals/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetGoal(int id)
        {
            var auth0Id = GetAuth0Id();
            
            if (string.IsNullOrEmpty(auth0Id))
            {
                return Unauthorized();
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Auth0Id == auth0Id);
            
            if (user == null)
            {
                return Unauthorized();
            }

            var goal = await _context.Goals
                .FirstOrDefaultAsync(g => g.Id == id && g.UserId == user.Id);

            if (goal == null)
            {
                return NotFound();
            }

            // Return a sanitized version of the goal to avoid circular references
            var sanitizedGoal = new
            {
                goal.Id,
                goal.Name,
                goal.Description,
                goal.StartDate,
                goal.TargetDate,
                goal.TargetValue,
                goal.Type,
                goal.Unit,
                goal.IsCompleted,
                goal.CompletedDate,
                goal.CreatedAt,
                goal.UpdatedAt,
                UserId = goal.UserId,
                goal.CurrentValue,
                // Include a simplified User object without the nested Goals collection
                User = new
                {
                    Id = user.Id,
                    Auth0Id = user.Auth0Id,
                    Name = user.Name,
                    Email = user.Email
                }
            };

            return Ok(sanitizedGoal);
        }

        // POST: api/Goals
        [HttpPost]
        public async Task<ActionResult<Goal>> CreateGoal([FromBody] object requestData)
        {
            try 
            {
                Console.WriteLine($"[Goals] CreateGoal - Received raw request data: {System.Text.Json.JsonSerializer.Serialize(requestData)}");
                
                // Try to extract the goal from either a direct goal object or a wrapped {goal: {...}} object
                Goal goal;
                try {
                    // First try to deserialize directly
                    goal = System.Text.Json.JsonSerializer.Deserialize<Goal>(requestData.ToString());
                    
                    // If that fails (null properties), check if it's wrapped in a 'goal' property
                    if (string.IsNullOrEmpty(goal?.Name) || string.IsNullOrEmpty(goal?.Description)) {
                        Console.WriteLine("[Goals] Direct deserialization failed, trying to extract from wrapper");
                        
                        // Use dynamic to access the 'goal' property if it exists
                        dynamic wrapper = System.Text.Json.JsonSerializer.Deserialize<dynamic>(requestData.ToString());
                        if (wrapper.TryGetProperty("goal", out System.Text.Json.JsonElement goalProperty)) {
                            Console.WriteLine("[Goals] Found 'goal' wrapper, deserializing from it");
                            goal = System.Text.Json.JsonSerializer.Deserialize<Goal>(goalProperty.ToString());
                        }
                    }
                }
                catch (Exception ex) {
                    Console.WriteLine($"[Goals] Error deserializing goal: {ex.Message}");
                    return BadRequest(new { 
                        error = "Invalid goal format", 
                        message = ex.Message,
                        details = "Goal must include Name, Description, and Unit properties"
                    });
                }
                
                // Validate the goal has required properties
                if (goal == null || string.IsNullOrEmpty(goal.Name) || string.IsNullOrEmpty(goal.Description) || string.IsNullOrEmpty(goal.Unit)) {
                    Console.WriteLine("[Goals] Validation failed - missing required properties");
                    return BadRequest(new {
                        error = "Missing required fields",
                        message = "Goal must include Name, Description, and Unit properties"
                    });
                }
                
                Console.WriteLine($"[Goals] Deserialized goal successfully: {goal.Name}, {goal.Description}, {goal.Unit}");
                
                // Handle User property if it was included in the payload
                if (goal.User != null && !string.IsNullOrEmpty(goal.User.Auth0Id))
                {
                    Console.WriteLine($"[Goals] User object included in payload with Auth0Id: {goal.User.Auth0Id}");
                    // We'll still use the token for security, but log that the client sent this data
                }
                
                var auth0Id = GetAuth0Id();
                
                if (string.IsNullOrEmpty(auth0Id))
                {
                    Console.WriteLine("[Goals] CreateGoal - No auth0Id found in token");
                    return Unauthorized();
                }

                Console.WriteLine($"[Goals] Using auth0Id from token: {auth0Id}");
                
                // Get all User claims for debugging purposes
                var allClaims = User.Claims.Select(c => new { c.Type, c.Value }).ToList();
                Console.WriteLine($"[Goals] All claims: {System.Text.Json.JsonSerializer.Serialize(allClaims)}");
                
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Auth0Id == auth0Id);
                
                if (user == null)
                {
                    Console.WriteLine($"[Goals] CreateGoal - User not found for auth0Id: {auth0Id}, creating new user record");
                    
                    // Extract name and email from claims
                    var name = User.Claims.FirstOrDefault(c => c.Type == "name" || c.Type == ClaimTypes.Name)?.Value;
                    var email = User.Claims.FirstOrDefault(c => c.Type == "email" || c.Type == ClaimTypes.Email)?.Value;
                    
                    // Use default values if not found in claims
                    name = !string.IsNullOrEmpty(name) ? name : "User"; 
                    email = !string.IsNullOrEmpty(email) ? email : "user@example.com";
                    
                    Console.WriteLine($"[Goals] Creating user with Name: {name}, Email: {email}");
                    
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
                        Console.WriteLine($"[Goals] User created successfully with ID: {user.Id}");
                    }
                    catch (Exception ex) {
                        Console.WriteLine($"[Goals] Error creating user: {ex.Message}");
                        return BadRequest(new {
                            error = "Failed to create user",
                            message = "Could not create user record",
                            details = ex.Message
                        });
                    }
                }

                Console.WriteLine($"[Goals] CreateGoal - Found user with ID: {user.Id}");
                goal.UserId = user.Id;
                goal.CreatedAt = DateTime.UtcNow;
                goal.UpdatedAt = DateTime.UtcNow;
                
                // Clear the navigation property to avoid issues
                goal.User = null;
                
                _context.Goals.Add(goal);
                
                try {
                    await _context.SaveChangesAsync();
                    Console.WriteLine($"[Goals] CreateGoal - Successfully created goal with ID: {goal.Id}");
                }
                catch (Exception ex) {
                    Console.WriteLine($"[Goals] CreateGoal - Error creating goal: {ex.Message}");
                    return BadRequest(new {
                        error = "Failed to create goal",
                        message = "Could not save goal to database",
                        details = ex.Message
                    });
                }

                // Return a sanitized version of the goal to avoid circular references in serialization
                var sanitizedGoal = new
                {
                    goal.Id,
                    goal.Name,
                    goal.Description,
                    goal.StartDate,
                    goal.TargetDate,
                    goal.TargetValue,
                    goal.Type,
                    goal.Unit,
                    goal.IsCompleted,
                    goal.CompletedDate,
                    goal.CreatedAt,
                    goal.UpdatedAt,
                    UserId = goal.UserId,
                    goal.CurrentValue,
                    // Include a simplified User object without the nested Goals collection
                    User = new
                    {
                        Id = user.Id,
                        Auth0Id = user.Auth0Id,
                        Name = user.Name,
                        Email = user.Email
                    }
                };

                return CreatedAtAction(nameof(GetGoal), new { id = goal.Id }, sanitizedGoal);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Goals] Unhandled exception in CreateGoal: {ex.Message}");
                Console.WriteLine($"[Goals] Stack trace: {ex.StackTrace}");
                
                return StatusCode(500, new {
                    error = "Server error",
                    message = "An unexpected error occurred while processing your request",
                    details = ex.Message
                });
            }
        }

        // PUT: api/Goals/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateGoal(int id, Goal goal)
        {
            if (id != goal.Id)
            {
                return BadRequest();
            }

            var auth0Id = GetAuth0Id();
            
            if (string.IsNullOrEmpty(auth0Id))
            {
                return Unauthorized();
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Auth0Id == auth0Id);
            
            if (user == null)
            {
                return Unauthorized();
            }

            // Check if the goal exists and belongs to the user
            var existingGoal = await _context.Goals
                .FirstOrDefaultAsync(g => g.Id == id && g.UserId == user.Id);

            if (existingGoal == null)
            {
                return NotFound();
            }

            existingGoal.Name = goal.Name;
            existingGoal.Description = goal.Description;
            existingGoal.Type = goal.Type;
            existingGoal.TargetValue = goal.TargetValue;
            existingGoal.Unit = goal.Unit;
            existingGoal.StartDate = goal.StartDate;
            existingGoal.TargetDate = goal.TargetDate;
            existingGoal.IsCompleted = goal.IsCompleted;
            existingGoal.CompletedDate = goal.IsCompleted ? (DateTime?)DateTime.UtcNow : null;
            existingGoal.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!GoalExists(id))
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

        // PATCH: api/Goals/5/complete
        [HttpPatch("{id}/complete")]
        public async Task<IActionResult> CompleteGoal(int id)
        {
            var auth0Id = GetAuth0Id();
            
            if (string.IsNullOrEmpty(auth0Id))
            {
                return Unauthorized();
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Auth0Id == auth0Id);
            
            if (user == null)
            {
                return Unauthorized();
            }

            var goal = await _context.Goals
                .FirstOrDefaultAsync(g => g.Id == id && g.UserId == user.Id);
                
            if (goal == null)
            {
                return NotFound();
            }

            goal.IsCompleted = true;
            goal.CompletedDate = DateTime.UtcNow;
            goal.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/Goals/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteGoal(int id)
        {
            var auth0Id = GetAuth0Id();
            
            if (string.IsNullOrEmpty(auth0Id))
            {
                return Unauthorized();
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Auth0Id == auth0Id);
            
            if (user == null)
            {
                return Unauthorized();
            }

            var goal = await _context.Goals
                .FirstOrDefaultAsync(g => g.Id == id && g.UserId == user.Id);
                
            if (goal == null)
            {
                return NotFound();
            }

            _context.Goals.Remove(goal);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/Goals/{id}/progress
        [HttpPost("{id}/progress")]
        public async Task<IActionResult> UpdateProgress(int id, [FromBody] GoalProgressUpdateDto progressData)
        {
            Console.WriteLine($"[Goals] UpdateProgress - Received progress update for goal {id}: {System.Text.Json.JsonSerializer.Serialize(progressData)}");
            
            if (progressData == null)
            {
                return BadRequest(new { error = "No progress data provided" });
            }
            
            var auth0Id = GetAuth0Id();
            
            if (string.IsNullOrEmpty(auth0Id))
            {
                Console.WriteLine("[Goals] UpdateProgress - No auth0Id found in token");
                return Unauthorized();
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Auth0Id == auth0Id);
            
            if (user == null)
            {
                Console.WriteLine($"[Goals] UpdateProgress - User not found for auth0Id: {auth0Id}");
                return Unauthorized();
            }

            // Check if the goal exists and belongs to the user
            var goal = await _context.Goals
                .FirstOrDefaultAsync(g => g.Id == id && g.UserId == user.Id);
                
            if (goal == null)
            {
                Console.WriteLine($"[Goals] UpdateProgress - Goal with ID {id} not found for user {user.Id}");
                return NotFound();
            }
            
            // Update the goal's current value
            goal.CurrentValue = progressData.CurrentValue;
            goal.UpdatedAt = DateTime.UtcNow;
            
            // Check if the goal is now completed based on the target value
            if (goal.Type == GoalType.Weight)
            {
                // For weight goals, we might want to lose weight (target < start)
                if ((goal.TargetValue <= 0 && progressData.CurrentValue <= goal.TargetValue) ||
                    (goal.TargetValue > 0 && progressData.CurrentValue >= goal.TargetValue))
                {
                    goal.IsCompleted = true;
                    goal.CompletedDate = DateTime.UtcNow;
                }
            }
            else
            {
                // For other goals, we typically want to increase (target > start)
                if (progressData.CurrentValue >= goal.TargetValue)
                {
                    goal.IsCompleted = true;
                    goal.CompletedDate = DateTime.UtcNow;
                }
            }
            
            // Create a new progress entry
            var progress = new GoalProgress
            {
                GoalId = id,
                CurrentValue = progressData.CurrentValue,
                Date = progressData.Date != default ? progressData.Date : DateTime.UtcNow,
                Notes = progressData.Notes,
                CreatedAt = DateTime.UtcNow
            };
            
            _context.GoalProgresses.Add(progress);
            
            try
            {
                await _context.SaveChangesAsync();
                Console.WriteLine($"[Goals] UpdateProgress - Successfully updated progress for goal {id}");
                
                return Ok(new
                {
                    goal.Id,
                    goal.Name,
                    goal.CurrentValue,
                    goal.TargetValue,
                    goal.IsCompleted,
                    progress.Date,
                    progress.Notes
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Goals] UpdateProgress - Error saving progress: {ex.Message}");
                return BadRequest(new
                {
                    error = "Failed to update progress",
                    message = ex.Message
                });
            }
        }

        // Data Transfer Object for goal progress updates
        public class GoalProgressUpdateDto
        {
            public decimal CurrentValue { get; set; }
            public DateTime Date { get; set; }
            public string Notes { get; set; }
        }

        private bool GoalExists(int id)
        {
            return _context.Goals.Any(e => e.Id == id);
        }
    }
} 