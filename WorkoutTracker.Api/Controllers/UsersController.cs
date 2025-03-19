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
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public UsersController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Users/me
        [HttpGet("me")]
        public async Task<ActionResult<User>> GetCurrentUser()
        {
            // 1. Extract and log Auth0 user ID from claims - look in both places
            var auth0Id = User.Claims.FirstOrDefault(c => c.Type == "sub")?.Value;
            
            // If sub claim not found, try the nameidentifier claim which is used by some providers (including Google OAuth)
            if (string.IsNullOrEmpty(auth0Id))
            {
                auth0Id = User.Claims.FirstOrDefault(c => 
                    c.Type == ClaimTypes.NameIdentifier ||
                    c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
                
                Console.WriteLine($"Nameidentifier claim used instead of sub: {auth0Id ?? "NULL"}");
            }
            
            Console.WriteLine($"User claims extraction - Auth0 ID: {auth0Id ?? "NULL"}");
            
            // Log all claims for debugging
            Console.WriteLine("All claims from token:");
            foreach (var claim in User.Claims)
            {
                Console.WriteLine($"  Claim type: {claim.Type}, value: {claim.Value}");
            }
            
            if (string.IsNullOrEmpty(auth0Id))
            {
                Console.WriteLine("ERROR: No user identifier claim found in token, returning Unauthorized");
                return Unauthorized();
            }

            try 
            {
                // 2. Try to find the user in the database
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Auth0Id == auth0Id);
                
                Console.WriteLine($"Database lookup result - User found: {user != null}");

                if (user == null)
                {
                    // 3. Create the user if they don't exist yet with more detailed logging
                    Console.WriteLine($"Creating new user with Auth0 ID: {auth0Id}");
                    
                    var name = User.Claims.FirstOrDefault(c => c.Type == "name")?.Value ?? "New User";
                    var email = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value 
                                ?? User.Claims.FirstOrDefault(c => c.Type == "email")?.Value 
                                ?? "email@example.com";
                    
                    Console.WriteLine($"New user details - Name: {name}, Email: {email}");
                    
                    user = new User
                    {
                        Auth0Id = auth0Id,
                        Name = name,
                        Email = email,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    _context.Users.Add(user);
                    
                    try {
                        await _context.SaveChangesAsync();
                        Console.WriteLine($"User successfully created with ID: {user.Id}");
                    }
                    catch (Exception ex) {
                        Console.WriteLine($"ERROR creating user: {ex.Message}");
                        Console.WriteLine($"Exception details: {ex}");
                        // Continue without failing - return a temporary user
                        user.Id = -1; // Mark as temporary
                    }
                }
                
                return user;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"CRITICAL ERROR in GetCurrentUser: {ex.Message}");
                Console.WriteLine($"Exception details: {ex}");
                
                // Instead of failing, return a temporary user to help debugging
                return new User 
                { 
                    Id = -999, 
                    Auth0Id = auth0Id,
                    Name = "Temporary Debug User",
                    Email = "debug@example.com"
                };
            }
        }

        // PUT: api/Users/me
        [HttpPut("me")]
        public async Task<IActionResult> UpdateCurrentUser(User userUpdate)
        {
            // Extract and log Auth0 user ID from claims - look in both places
            var auth0Id = User.Claims.FirstOrDefault(c => c.Type == "sub")?.Value;
            
            // If sub claim not found, try the nameidentifier claim which is used by some providers (including Google OAuth)
            if (string.IsNullOrEmpty(auth0Id))
            {
                auth0Id = User.Claims.FirstOrDefault(c => 
                    c.Type == ClaimTypes.NameIdentifier || 
                    c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
            }
            
            if (string.IsNullOrEmpty(auth0Id))
            {
                return Unauthorized();
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Auth0Id == auth0Id);

            if (user == null)
            {
                return NotFound();
            }

            // Update allowed fields only
            user.Name = userUpdate.Name;
            user.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!UserExists(user.Id))
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

        private bool UserExists(int id)
        {
            return _context.Users.Any(e => e.Id == id);
        }
    }
} 