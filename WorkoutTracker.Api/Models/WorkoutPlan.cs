using System;
using System.Collections.Generic;

namespace WorkoutTracker.Api.Models
{
    public class WorkoutPlan
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public int UserId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        
        // Navigation properties
        public User User { get; set; }
        public ICollection<Exercise> Exercises { get; set; }
    }
} 