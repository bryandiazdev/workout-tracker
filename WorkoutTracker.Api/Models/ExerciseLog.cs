using System;

namespace WorkoutTracker.Api.Models
{
    public class ExerciseLog
    {
        public int Id { get; set; }
        public int WorkoutLogId { get; set; }
        public int? ExerciseId { get; set; }
        public string ExerciseName { get; set; }
        public int Sets { get; set; }
        public int Reps { get; set; }
        public decimal? Weight { get; set; }
        public TimeSpan? Duration { get; set; }
        public string Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        
        // Navigation properties
        public WorkoutLog WorkoutLog { get; set; }
        public Exercise Exercise { get; set; }
    }
} 