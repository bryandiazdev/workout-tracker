using System;
using System.Collections.Generic;

namespace WorkoutTracker.Api.Models
{
    public class Exercise
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public int WorkoutPlanId { get; set; }
        public int Sets { get; set; }
        public int Reps { get; set; }
        public decimal? Weight { get; set; }
        public TimeSpan? Duration { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        
        // Navigation properties
        public WorkoutPlan WorkoutPlan { get; set; }
    }
} 