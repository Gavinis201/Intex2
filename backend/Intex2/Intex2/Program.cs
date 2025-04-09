using Intex2.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddDbContext<MoviesDBContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("MovieConnection")));

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
})
.AddEntityFrameworkStores<MoviesDBContext>()
.AddDefaultTokenProviders();

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
        ValidAudience = builder.Configuration["JWT:ValidAudience"],
        ValidIssuer = builder.Configuration["JWT:ValidIssuer"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["JWT:Secret"]))
    };
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
                .AllowCredentials()
                .AllowAnyMethod()
                .AllowAnyHeader();
        });
});

// Cookies
builder.Services.Configure<CookiePolicyOptions>(options =>
{
    options.CheckConsentNeeded = context => true; // Require consent before setting cookies
    options.MinimumSameSitePolicy = SameSiteMode.Lax;
});


var app = builder.Build();

// Content Security Policy: Attack Mitigations
app.Use(async (context, next) =>
{
    context.Response.Headers.Add("Content-Security-Policy",
        "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'");
    await next();
});

// Seed roles and admin user
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    await Intex2.Data.IdentitySeeder.SeedRolesAndAdmin(services);
}

// Initialize the database
app.InitializeDatabase();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Intex2 API V1");
    });
}

app.UseCors("AllowReactAppBlah");

app.UseHttpsRedirection();
app.UseCookiePolicy();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Use port 5000
app.Urls.Clear();
app.Urls.Add("https://localhost:5000");

app.Run();