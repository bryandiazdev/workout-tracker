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
    public class ExercisesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ExercisesController(ApplicationDbContext context)
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
                
                Console.WriteLine($"[Exercises] Using nameidentifier instead of sub: {auth0Id ?? "NULL"}");
            }
            
            return auth0Id;
        }

        // GET: api/Exercises/plan/5
        [HttpGet("plan/{planId}")]
        public async Task<ActionResult<IEnumerable<Exercise>>> GetExercisesByPlan(int planId)
        {
            var auth0Id = GetAuth0Id();
            
            if (string.IsNullOrEmpty(auth0Id))
            {
                Console.WriteLine("[Exercises] GetExercisesByPlan - No auth0Id found in token");
                return Unauthorized();
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Auth0Id == auth0Id);
            
            if (user == null)
            {
                Console.WriteLine($"[Exercises] GetExercisesByPlan - User not found for auth0Id: {auth0Id}");
                return Unauthorized();
            }

            // Check if the workout plan belongs to the user
            var workoutPlan = await _context.WorkoutPlans
                .FirstOrDefaultAsync(wp => wp.Id == planId && wp.UserId == user.Id);
                
            if (workoutPlan == null)
            {
                return NotFound();
            }

            return await _context.Exercises
                .Where(e => e.WorkoutPlanId == planId)
                .ToListAsync();
        }

        // GET: api/Exercises/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Exercise>> GetExercise(int id)
        {
            var auth0Id = GetAuth0Id();
            
            if (string.IsNullOrEmpty(auth0Id))
            {
                Console.WriteLine("[Exercises] GetExercise - No auth0Id found in token");
                return Unauthorized();
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Auth0Id == auth0Id);
            
            if (user == null)
            {
                Console.WriteLine($"[Exercises] GetExercise - User not found for auth0Id: {auth0Id}");
                return Unauthorized();
            }

            var exercise = await _context.Exercises
                .Include(e => e.WorkoutPlan)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (exercise == null)
            {
                return NotFound();
            }

            // Check if the exercise belongs to a workout plan of the user
            if (exercise.WorkoutPlan.UserId != user.Id)
            {
                return Unauthorized();
            }

            return exercise;
        }

        // POST: api/Exercises
        [HttpPost]
        public async Task<ActionResult<Exercise>> CreateExercise(Exercise exercise)
        {
            var auth0Id = GetAuth0Id();
            
            if (string.IsNullOrEmpty(auth0Id))
            {
                Console.WriteLine("[Exercises] CreateExercise - No auth0Id found in token");
                return Unauthorized();
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Auth0Id == auth0Id);
            
            if (user == null)
            {
                Console.WriteLine($"[Exercises] CreateExercise - User not found for auth0Id: {auth0Id}");
                return Unauthorized();
            }

            // Check if the workout plan belongs to the user
            var workoutPlan = await _context.WorkoutPlans
                .FirstOrDefaultAsync(wp => wp.Id == exercise.WorkoutPlanId && wp.UserId == user.Id);
                
            if (workoutPlan == null)
            {
                return NotFound("Workout plan not found or doesn't belong to the user.");
            }

            exercise.CreatedAt = DateTime.UtcNow;
            exercise.UpdatedAt = DateTime.UtcNow;
            
            _context.Exercises.Add(exercise);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetExercise), new { id = exercise.Id }, exercise);
        }

        // PUT: api/Exercises/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateExercise(int id, Exercise exercise)
        {
            if (id != exercise.Id)
            {
                return BadRequest();
            }

            var auth0Id = GetAuth0Id();
            
            if (string.IsNullOrEmpty(auth0Id))
            {
                Console.WriteLine("[Exercises] UpdateExercise - No auth0Id found in token");
                return Unauthorized();
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Auth0Id == auth0Id);
            
            if (user == null)
            {
                Console.WriteLine($"[Exercises] UpdateExercise - User not found for auth0Id: {auth0Id}");
                return Unauthorized();
            }

            // Check if the workout plan belongs to the user
            var workoutPlan = await _context.WorkoutPlans
                .FirstOrDefaultAsync(wp => wp.Id == exercise.WorkoutPlanId && wp.UserId == user.Id);
                
            if (workoutPlan == null)
            {
                return NotFound("Workout plan not found or doesn't belong to the user.");
            }

            // Check if the exercise exists and belongs to the workout plan
            var existingExercise = await _context.Exercises
                .Include(e => e.WorkoutPlan)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (existingExercise == null)
            {
                return NotFound();
            }

            // Check if the exercise belongs to a workout plan of the user
            if (existingExercise.WorkoutPlan.UserId != user.Id)
            {
                return Unauthorized();
            }

            existingExercise.Name = exercise.Name;
            existingExercise.Description = exercise.Description;
            existingExercise.Sets = exercise.Sets;
            existingExercise.Reps = exercise.Reps;
            existingExercise.Weight = exercise.Weight;
            existingExercise.Duration = exercise.Duration;
            existingExercise.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ExerciseExists(id))
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

        // DELETE: api/Exercises/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteExercise(int id)
        {
            var auth0Id = GetAuth0Id();
            
            if (string.IsNullOrEmpty(auth0Id))
            {
                Console.WriteLine("[Exercises] DeleteExercise - No auth0Id found in token");
                return Unauthorized();
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Auth0Id == auth0Id);
            
            if (user == null)
            {
                Console.WriteLine($"[Exercises] DeleteExercise - User not found for auth0Id: {auth0Id}");
                return Unauthorized();
            }

            var exercise = await _context.Exercises
                .Include(e => e.WorkoutPlan)
                .FirstOrDefaultAsync(e => e.Id == id);
                
            if (exercise == null)
            {
                return NotFound();
            }

            // Check if the exercise belongs to a workout plan of the user
            if (exercise.WorkoutPlan.UserId != user.Id)
            {
                return Unauthorized();
            }

            _context.Exercises.Remove(exercise);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ExerciseExists(int id)
        {
            return _context.Exercises.Any(e => e.Id == id);
        }
    }
} 