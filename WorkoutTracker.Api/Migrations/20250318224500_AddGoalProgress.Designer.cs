// <auto-generated />
using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;
using WorkoutTracker.Api.Data;

namespace WorkoutTracker.Api.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20250318224500_AddGoalProgress")]
    partial class AddGoalProgress
    {
        protected override void BuildTargetModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("Relational:MaxIdentifierLength", 63)
                .HasAnnotation("ProductVersion", "5.0.17")
                .HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

            // Models will be generated here. Since this is auto-generated,
            // we're only providing a skeleton for the migration designer file.

#pragma warning restore 612, 618
        }
    }
} 