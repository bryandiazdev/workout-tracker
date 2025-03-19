using System;

namespace WorkoutTracker.Api.Models
{
    public class GoalProgress
    {
        public int Id { get; set; }
        public int GoalId { get; set; }
        public decimal CurrentValue { get; set; }
        public DateTime Date { get; set; }
        public string Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        
        // Navigation property
        public Goal Goal { get; set; }
    }
} 