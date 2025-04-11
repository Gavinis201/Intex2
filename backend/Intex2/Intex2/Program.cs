using Intex2.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.Data.Sqlite;
using DotNetEnv;

var builder = WebApplication.CreateBuilder(args);

// Load environment variables from .env file (if it exists)
DotNetEnv.Env.Load();

// Add services to the container
builder.Services.AddControllers();

// Get database connection from environment variable or fallback to configuration
var connectionString = Environment.GetEnvironmentVariable("MOVIE_CONNECTION_STRING") ?? 
    builder.Configuration.GetConnectionString("MovieConnection");

builder.Services.AddDbContext<MoviesDBContext>(options =>
    options.UseSqlite(connectionString));

// Add ASP.NET Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options => 
{
    // Configure stronger password requirements
    options.Password.RequiredLength = 8;
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = true;
    
    // Configure user settings
    options.User.RequireUniqueEmail = true;
    
    // Configure lockout settings
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;
    
    // Configure sign-in settings
    options.SignIn.RequireConfirmedEmail = false;
    options.SignIn.RequireConfirmedAccount = false;

    // Configure 2FA
    options.Tokens.AuthenticatorTokenProvider = TokenOptions.DefaultAuthenticatorProvider;
})
.AddEntityFrameworkStores<MoviesDBContext>()
.AddDefaultTokenProviders()
.AddTokenProvider<AuthenticatorTokenProvider<ApplicationUser>>(TokenOptions.DefaultAuthenticatorProvider);

// Get JWT settings from environment variables or fall back to configuration
var jwtAudience = Environment.GetEnvironmentVariable("JWT_VALID_AUDIENCE") ?? 
    builder.Configuration["JWT:ValidAudience"] ?? "http://localhost:3000";
var jwtIssuer = Environment.GetEnvironmentVariable("JWT_VALID_ISSUER") ?? 
    builder.Configuration["JWT:ValidIssuer"] ?? "http://localhost:5000";
var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET") ?? 
    builder.Configuration["JWT:Secret"] ?? "JWTAuthenticationSecretKey123456789";

// Configure JWT Authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.SaveToken = true;
    options.RequireHttpsMetadata = false;
    options.TokenValidationParameters = new TokenValidationParameters()
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidIssuer = jwtIssuer,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ClockSkew = TimeSpan.Zero // Remove delay of token when expire
    };
});

// Add authorization policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireAdministratorRole", policy => policy.RequireRole("Administrator"));
    options.AddPolicy("RequireUserRole", policy => policy.RequireRole("User"));
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo { Title = "Intex2 API", Version = "v1" });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactAppBlah", 
        policy =>
        {
            policy.WithOrigins("http://localhost:3000", "https://localhost:3000")
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials();
        });
});

var app = builder.Build();

// Content Security Policy: Attack Mitigations
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("Content-Security-Policy",
        "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'");
    await next();
});

// Seed roles and admin user
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<MoviesDBContext>();
        
        // Only create Identity tables if they don't exist
        if (!context.Database.GetPendingMigrations().Any())
        {
            // Execute the Identity tables creation script
            var connection = (SqliteConnection)context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open)
            {
                connection.Open();
            }

            string sqlScript = File.ReadAllText("Data/CreateIdentityTables.sql");
            using var command = connection.CreateCommand();
            command.CommandText = sqlScript;
            command.ExecuteNonQuery();
        }
        
        await Intex2.Data.IdentitySeeder.SeedRolesAndAdmin(services);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while seeding the database.");
    }
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Intex2 API V1");
    });
}

app.UseCors("AllowReactAppBlah");

app.UseHttpsRedirection();

app.UseCookiePolicy(); // Add cookies
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Use port from environment variable or default to 5000
var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";
app.Urls.Clear();
app.Urls.Add($"https://localhost:{port}");

app.Run();