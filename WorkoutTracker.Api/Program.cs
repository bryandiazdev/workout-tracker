using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using WorkoutTracker.Api.Data;
using WorkoutTracker.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Configure Entity Framework Core with PostgreSQL instead of SQL Server
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("PostgresConnection") ??
                     builder.Configuration.GetConnectionString("DefaultConnection")));

// Configure Auth0 authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = $"https://{builder.Configuration["Auth0:Domain"]}";
        options.Audience = builder.Configuration["Auth0:Audience"];
        options.TokenValidationParameters = new TokenValidationParameters
        {
            NameClaimType = "name",
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = false,
            AudienceValidator = (audiences, securityToken, validationParameters) =>
            {
                string expectedAudience = builder.Configuration["Auth0:Audience"];
                
                Console.WriteLine($"Validating token audience. Expected: {expectedAudience}");
                if (audiences != null)
                {
                    foreach (var audience in audiences)
                    {
                        Console.WriteLine($"Token contains audience: {audience}");
                        if (audience.Equals(expectedAudience, StringComparison.OrdinalIgnoreCase))
                        {
                            return true;
                        }
                    }
                }
                
                Console.WriteLine("Token audience validation failed");
                return false;
            }
        };
    });

builder.Services.AddAuthorization();

// Configure JSON serialization to handle circular references
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.Preserve;
        options.JsonSerializerOptions.MaxDepth = 64; // Increase max depth if needed
    });

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowVueApp", 
        policy => policy
            .WithOrigins(
                "http://localhost:8080", 
                "http://localhost:8081",
                "https://workout-tracker-client.vercel.app"
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials());
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Initialize database with better error handling
try 
{
    Console.WriteLine("Initializing database...");
    DatabaseInitializer.Initialize(app.Services);
    Console.WriteLine("Database initialization completed successfully.");
}
catch (Exception ex)
{
    Console.WriteLine($"Fatal error during database initialization: {ex.Message}");
    Console.WriteLine($"Application startup may be compromised. Please check database configuration.");
    // In production, you might want to throw here to prevent the app from starting
    // with a broken database, but for now, we'll continue
}

app.UseHttpsRedirection();
app.UseCors("AllowVueApp");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
