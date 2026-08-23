using Amazon.S3;
using CloudDocs.API.Data;
using CloudDocs.API.Services;
using CloudDocs.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// ==========================================
// 1. Controller & OpenAPI Setup
// ==========================================
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ==========================================
// 2. Configure PostgreSQL with EF Core
// ==========================================
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? throw new InvalidOperationException("Database connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        // Enable automatic retry on transient failure
        npgsqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(10),
            errorCodesToAdd: null);
    }));

// ==========================================
// 3. Configure AWS S3 Client & Custom Services
// ==========================================
// Registers IAmazonS3 into the DI container reading from the "AWS" section in appsettings.json
builder.Services.AddAWSService<IAmazonS3>(builder.Configuration.GetAWSOptions("AWS"));

// Register custom Storage Service abstraction
builder.Services.AddScoped<IStorageService, StorageService>();

// ==========================================
// 4. Configure CORS for React Frontend
// ==========================================
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
                     ?? new[] { "http://localhost:5173" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// ==========================================
// 5. Middleware Pipeline Configuration
// ==========================================
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "CloudDocs API v1");
    });
}

app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

app.UseAuthorization();

app.MapControllers();

// Automatically apply database migrations on startup (Optional for development)
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

app.Run();