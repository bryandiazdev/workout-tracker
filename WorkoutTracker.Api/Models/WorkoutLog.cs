using System;
using System.Collections.Generic;

namespace WorkoutTracker.Api.Models
{
    public class WorkoutLog
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int? WorkoutPlanId { get; set; }
        public string Notes { get; set; }
        public DateTime WorkoutDate { get; set; }
        public TimeSpan Duration { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        
        // Navigation properties
        public User User { get; set; }
        public WorkoutPlan WorkoutPlan { get; set; }
        public ICollection<ExerciseLog> ExerciseLogs { get; set; }
    }
} 