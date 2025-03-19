using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

namespace WorkoutTracker.Api.Migrations
{
    public partial class AddGoalProgress : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add CurrentValue column to Goals table
            migrationBuilder.AddColumn<decimal>(
                name: "CurrentValue",
                table: "Goals",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            // Create GoalProgresses table
            migrationBuilder.CreateTable(
                name: "GoalProgresses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    GoalId = table.Column<int>(type: "integer", nullable: false),
                    CurrentValue = table.Column<decimal>(type: "numeric", nullable: false),
                    Date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GoalProgresses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GoalProgresses_Goals_GoalId",
                        column: x => x.GoalId,
                        principalTable: "Goals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GoalProgresses_GoalId",
                table: "GoalProgresses",
                column: "GoalId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GoalProgresses");

            migrationBuilder.DropColumn(
                name: "CurrentValue",
                table: "Goals");
        }
    }
} 