using System;

namespace WorkoutTracker.Api.Models
{
    public class Goal
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public GoalType Type { get; set; }
        public decimal TargetValue { get; set; }
        public decimal CurrentValue { get; set; }
        public string Unit { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime TargetDate { get; set; }
        public bool IsCompleted { get; set; }
        public DateTime? CompletedDate { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        
        // Navigation properties
        public User User { get; set; }
    }
    
    public enum GoalType
    {
        Weight,
        Strength,
        Endurance,
        Frequency,
        Other
    }
} 