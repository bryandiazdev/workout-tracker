using System;
using System.Collections.Generic;

namespace WorkoutTracker.Api.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Auth0Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        
        // Navigation properties
        public ICollection<WorkoutPlan> WorkoutPlans { get; set; }
        public ICollection<WorkoutLog> WorkoutLogs { get; set; }
        public ICollection<Goal> Goals { get; set; }
    }
} 