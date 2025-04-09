using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Intex2.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Intex2.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IConfiguration _configuration;
    private readonly MoviesDBContext _context;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IConfiguration configuration,
        MoviesDBContext context)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _configuration = configuration;
        _context = context;
    }

    [HttpPost]
    [Route("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginModel model)
    {
        try
        {
            Console.WriteLine($"Login attempt for email: {model.Email}");
            
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
            {
                Console.WriteLine($"User not found: {model.Email}");
                return Unauthorized(new AuthResponse
                {
                    Success = false,
                    Message = "Invalid email or password"
                });
            }

            Console.WriteLine($"User found: {user.Email}, checking password");
            var result = await _signInManager.CheckPasswordSignInAsync(user, model.Password, false);
            if (!result.Succeeded)
            {
                Console.WriteLine($"Password check failed for user: {user.Email}");
                return Unauthorized(new AuthResponse
                {
                    Success = false,
                    Message = "Invalid email or password"
                });
            }

            Console.WriteLine($"Password check succeeded for user: {user.Email}, generating token");
            var authClaims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, user.UserName),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            };

            var token = GetToken(authClaims);
            Console.WriteLine($"Token generated for user: {user.Email}, expires: {token.ValidTo}");

            return Ok(new AuthResponse
            {
                Token = new JwtSecurityTokenHandler().WriteToken(token),
                Expiration = token.ValidTo,
                Success = true,
                Message = "Login successful"
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Exception in Login: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
            }
            return StatusCode(500, new AuthResponse 
            { 
                Success = false, 
                Message = "An error occurred during login. Please try again later."
            });
        }
    }

    [HttpPost]
    [Route("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterModel model)
    {
        var userExists = await _userManager.FindByEmailAsync(model.Email);
        if (userExists != null)
        {
            return StatusCode(StatusCodes.Status400BadRequest, new AuthResponse
            {
                Success = false,
                Message = "User already exists!"
            });
        }

        // Find the matching MoviesUser record
        var moviesUser = await _context.MoviesUsers
            .FirstOrDefaultAsync(u => u.Email == model.Email);

        if (moviesUser == null)
        {
            return StatusCode(StatusCodes.Status404NotFound, new AuthResponse
            {
                Success = false,
                Message = "No matching user found in the database. Please try again or contact support."
            });
        }

        if (!moviesUser.UserId.HasValue)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new AuthResponse
            {
                Success = false,
                Message = "The user record has an invalid ID."
            });
        }

        var user = new ApplicationUser
        {
            UserName = model.Email,
            Email = model.Email,
            SecurityStamp = Guid.NewGuid().ToString(),
            MoviesUserId = moviesUser.UserId
        };

        var result = await _userManager.CreateAsync(user, model.Password);
        if (!result.Succeeded)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new AuthResponse
            {
                Success = false,
                Message = "User creation failed! " + string.Join(", ", result.Errors.Select(e => e.Description))
            });
        }

        // Auto-login the user by generating a token
        var authClaims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, user.UserName),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        var token = GetToken(authClaims);

        return Ok(new AuthResponse
        {
            Success = true,
            Message = "User created successfully!",
            Token = new JwtSecurityTokenHandler().WriteToken(token),
            Expiration = token.ValidTo
        });
    }

    [HttpGet]
    [Route("pingauth")]
    [AllowAnonymous]
    public IActionResult PingAuth()
    {
        return Ok(new { Message = "Auth service is running" });
    }

    [HttpGet]
    [Route("protected")]
    [Authorize]
    public IActionResult Protected()
    {
        return Ok(new { Message = "This is a protected endpoint", User = User.Identity.Name });
    }

    [HttpGet]
    [Route("createtestuser")]
    [AllowAnonymous]
    public async Task<IActionResult> CreateTestUser()
    {
        try
        {
            // Check if the test user already exists
            string testEmail = "esmith@hotmail.com";
            var existingUser = await _userManager.FindByEmailAsync(testEmail);
            
            if (existingUser != null)
            {
                // Delete the existing user
                Console.WriteLine($"Deleting existing test user: {testEmail}");
                await _userManager.DeleteAsync(existingUser);
            }
            
            // Find the MoviesUser record for esmith@hotmail.com
            var moviesUser = await _context.MoviesUsers
                .FirstOrDefaultAsync(u => u.Email == testEmail);
                
            if (moviesUser == null)
            {
                return NotFound($"User with email {testEmail} not found in MoviesUsers table");
            }
            
            // Create a new Identity user
            var applicationUser = new ApplicationUser
            {
                UserName = testEmail,
                Email = testEmail,
                SecurityStamp = Guid.NewGuid().ToString(),
                MoviesUserId = moviesUser.UserId
            };
            
            // Use a simple test password that meets all requirements
            string testPassword = "Test123!";
            
            Console.WriteLine($"Creating test user with email: {testEmail}");
            var result = await _userManager.CreateAsync(applicationUser, testPassword);
            
            if (result.Succeeded)
            {
                Console.WriteLine($"Test user created successfully. Password: {testPassword}");
                return Ok($"Test user created with email: {testEmail} and password: {testPassword}");
            }
            else
            {
                return StatusCode(500, $"Failed to create test user: {string.Join(", ", result.Errors.Select(e => e.Description))}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Exception creating test user: {ex.Message}");
            return StatusCode(500, $"Exception: {ex.Message}");
        }
    }

    private JwtSecurityToken GetToken(List<Claim> authClaims)
    {
        try
        {
            var jwtSecret = _configuration["JWT:Secret"] ?? "JWTAuthenticationSecretKey123456789";
            var issuer = _configuration["JWT:ValidIssuer"] ?? "http://localhost:5000";
            var audience = _configuration["JWT:ValidAudience"] ?? "http://localhost:3000";
            
            Console.WriteLine($"JWT Secret: {(string.IsNullOrEmpty(jwtSecret) ? "NOT SET" : "SET")}");
            Console.WriteLine($"JWT Issuer: {issuer}");
            Console.WriteLine($"JWT Audience: {audience}");
            
            var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                expires: DateTime.Now.AddHours(3),
                claims: authClaims,
                signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
            );

            return token;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetToken: {ex.Message}");
            throw;
        }
    }
} 