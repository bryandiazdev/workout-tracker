using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WorkoutTracker.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HealthController : ControllerBase
    {
        // Public health check endpoint - no authentication required
        [HttpGet]
        [AllowAnonymous]
        public IActionResult Get()
        {
            return Ok(new
            {
                status = "healthy",
                message = "API is running normally",
                timestamp = DateTime.UtcNow
            });
        }

        // Authenticated health check endpoint
        [HttpGet("auth")]
        [Authorize]
        public IActionResult GetAuth()
        {
            // Get user claims from the token
            var userId = User.FindFirst("sub")?.Value;
            var name = User.FindFirst("name")?.Value;
            var email = User.FindFirst("email")?.Value;

            return Ok(new
            {
                status = "authenticated",
                message = "You are properly authenticated",
                userId = userId,
                name = name,
                email = email,
                timestamp = DateTime.UtcNow
            });
        }
    }
} 