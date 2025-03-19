using Microsoft.EntityFrameworkCore;
using WorkoutTracker.Api.Models;

namespace WorkoutTracker.Api.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }
        
        public DbSet<User> Users { get; set; }
        public DbSet<WorkoutPlan> WorkoutPlans { get; set; }
        public DbSet<Exercise> Exercises { get; set; }
        public DbSet<WorkoutLog> WorkoutLogs { get; set; }
        public DbSet<ExerciseLog> ExerciseLogs { get; set; }
        public DbSet<Goal> Goals { get; set; }
        public DbSet<GoalProgress> GoalProgresses { get; set; }
        
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // Configure User entity
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Auth0Id)
                .IsUnique();
                
            // Configure relationships
            modelBuilder.Entity<WorkoutPlan>()
                .HasOne(wp => wp.User)
                .WithMany(u => u.WorkoutPlans)
                .HasForeignKey(wp => wp.UserId);
                
            modelBuilder.Entity<Exercise>()
                .HasOne(e => e.WorkoutPlan)
                .WithMany(wp => wp.Exercises)
                .HasForeignKey(e => e.WorkoutPlanId);
                
            modelBuilder.Entity<WorkoutLog>()
                .HasOne(wl => wl.User)
                .WithMany(u => u.WorkoutLogs)
                .HasForeignKey(wl => wl.UserId);
                
            modelBuilder.Entity<WorkoutLog>()
                .HasOne(wl => wl.WorkoutPlan)
                .WithMany()
                .HasForeignKey(wl => wl.WorkoutPlanId)
                .IsRequired(false);
                
            modelBuilder.Entity<ExerciseLog>()
                .HasOne(el => el.WorkoutLog)
                .WithMany(wl => wl.ExerciseLogs)
                .HasForeignKey(el => el.WorkoutLogId);
                
            modelBuilder.Entity<ExerciseLog>()
                .HasOne(el => el.Exercise)
                .WithMany()
                .HasForeignKey(el => el.ExerciseId)
                .IsRequired(false);
                
            modelBuilder.Entity<Goal>()
                .HasOne(g => g.User)
                .WithMany(u => u.Goals)
                .HasForeignKey(g => g.UserId);
            
            modelBuilder.Entity<GoalProgress>()
                .HasOne(gp => gp.Goal)
                .WithMany()
                .HasForeignKey(gp => gp.GoalId);
        }
    }
} 