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
using Microsoft.Extensions.Logging;
using System.Net;
using System.Security.Cryptography;
using System.Text.Encodings.Web;

namespace Intex2.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IConfiguration _configuration;
    private readonly MoviesDBContext _context;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IConfiguration configuration,
        MoviesDBContext context,
        ILogger<AuthController> logger)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _configuration = configuration;
        _context = context;
        _logger = logger;
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
            
            // Check if two-factor authentication is enabled for this user
            if (await _userManager.GetTwoFactorEnabledAsync(user))
            {
                Console.WriteLine($"Two-factor authentication is enabled for user: {user.Email}");
                
                // Generate and send the token (in a real app, you'd send via SMS or email)
                var providers = await _userManager.GetValidTwoFactorProvidersAsync(user);
                if (providers.Contains("Authenticator"))
                {
                    // User needs to use their authenticator app
                    return Ok(new AuthResponse
                    {
                        Success = true,
                        RequiresTwoFactor = true,
                        Message = "Requires two-factor authentication"
                    });
                }
            }

            Console.WriteLine($"Password check succeeded for user: {user.Email}, generating token");
            var authClaims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, user.UserName),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            };

            // Check if this user is the admin (Stephen Peters)
            if (user.MoviesUserId.HasValue)
            {
                var moviesUser = await _context.MoviesUsers.FindAsync(user.MoviesUserId);
                if (moviesUser != null && moviesUser.Admin == 1)
                {
                    // Add admin role to claims
                    authClaims.Add(new Claim(ClaimTypes.Role, "Administrator"));
                    Console.WriteLine($"Added Administrator role to user: {user.Email}");
                    
                    // Also ensure user is in the admin role in the database
                    if (!await _userManager.IsInRoleAsync(user, "Administrator"))
                    {
                        await _userManager.AddToRoleAsync(user, "Administrator");
                        Console.WriteLine($"Added user {user.Email} to Administrator role in database");
                    }
                }
            }

            // Add the user ID to claims
            authClaims.Add(new Claim(ClaimTypes.NameIdentifier, user.Id));
            if (user.MoviesUserId.HasValue)
            {
                authClaims.Add(new Claim("MoviesUserId", user.MoviesUserId.Value.ToString()));
            }

            var token = GetToken(authClaims);
            Console.WriteLine($"Token generated for user: {user.Email}, expires: {token.ValidTo}");
            
            // Set auth cookie
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = token.ValidTo
            };
            Response.Cookies.Append("authToken", new JwtSecurityTokenHandler().WriteToken(token), cookieOptions);
            Response.Cookies.Append("userEmail", user.Email, cookieOptions);
            Response.Cookies.Append("userId", user.Id, cookieOptions);
            if (user.MoviesUserId.HasValue)
            {
                Response.Cookies.Append("moviesUserId", user.MoviesUserId.Value.ToString(), cookieOptions);
            }
            
            Console.WriteLine("Set authentication cookies");

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
            new Claim(ClaimTypes.NameIdentifier, user.Id)
        };
        
        if (user.MoviesUserId.HasValue)
        {
            authClaims.Add(new Claim("MoviesUserId", user.MoviesUserId.Value.ToString()));
        }

        var token = GetToken(authClaims);
        
        // Set auth cookie
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = token.ValidTo
        };
        Response.Cookies.Append("authToken", new JwtSecurityTokenHandler().WriteToken(token), cookieOptions);
        Response.Cookies.Append("userEmail", user.Email, cookieOptions);
        Response.Cookies.Append("userId", user.Id, cookieOptions);
        if (user.MoviesUserId.HasValue)
        {
            Response.Cookies.Append("moviesUserId", user.MoviesUserId.Value.ToString(), cookieOptions);
        }

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

    [HttpPost]
    [Route("refresh-token")]
    [Authorize]
    public async Task<IActionResult> RefreshToken()
    {
        try
        {
            // Get the current user
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userManager.FindByIdAsync(userId);
            
            if (user == null)
            {
                return Unauthorized(new AuthResponse
                {
                    Success = false,
                    Message = "User not found"
                });
            }
            
            // Create fresh claims for the token
            var authClaims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, user.UserName),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.NameIdentifier, user.Id)
            };

            // Check if this user is an admin and add the role claim
            if (user.MoviesUserId.HasValue)
            {
                var moviesUser = await _context.MoviesUsers.FindAsync(user.MoviesUserId);
                authClaims.Add(new Claim("MoviesUserId", user.MoviesUserId.Value.ToString()));
                
                if (moviesUser != null && moviesUser.Admin == 1)
                {
                    // Add admin role to claims
                    authClaims.Add(new Claim(ClaimTypes.Role, "Administrator"));
                    Console.WriteLine($"Added Administrator role to refreshed token for user: {user.Email}");
                    
                    // Also ensure user is in the admin role in the database
                    if (!await _userManager.IsInRoleAsync(user, "Administrator"))
                    {
                        await _userManager.AddToRoleAsync(user, "Administrator");
                        Console.WriteLine($"Added user {user.Email} to Administrator role in database");
                    }
                }
            }

            var token = GetToken(authClaims);
            
            // Set auth cookie
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = token.ValidTo
            };
            Response.Cookies.Append("authToken", new JwtSecurityTokenHandler().WriteToken(token), cookieOptions);
            
            return Ok(new AuthResponse
            {
                Token = new JwtSecurityTokenHandler().WriteToken(token),
                Expiration = token.ValidTo,
                Success = true,
                Message = "Token refreshed successfully"
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Exception in RefreshToken: {ex.Message}");
            return StatusCode(500, new AuthResponse 
            { 
                Success = false, 
                Message = "An error occurred during token refresh. Please try again later."
            });
        }
    }

    [HttpPost]
    [Route("reset-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordModel model)
    {
        try
        {
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
            {
                return BadRequest(new AuthResponse { Success = false, Message = "User not found" });
            }

            var result = await _userManager.ResetPasswordAsync(user, model.Token, model.NewPassword);
            if (!result.Succeeded)
            {
                return BadRequest(new AuthResponse 
                { 
                    Success = false, 
                    Message = string.Join(", ", result.Errors.Select(e => e.Description))
                });
            }

            return Ok(new AuthResponse { Success = true, Message = "Password reset successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting password");
            return StatusCode(500, new AuthResponse { Success = false, Message = "Error resetting password" });
        }
    }

    [HttpPost]
    [Route("forgot-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordModel model)
    {
        try
        {
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
            {
                return BadRequest(new AuthResponse { Success = false, Message = "User not found" });
            }

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            // In a real application, you would send this token via email
            // For now, we'll just return it
            return Ok(new { Token = token });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating password reset token");
            return StatusCode(500, new AuthResponse { Success = false, Message = "Error generating password reset token" });
        }
    }

    [HttpPost]
    [Route("two-factor-setup")]
    [Authorize]
    public async Task<IActionResult> SetupTwoFactor()
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { Message = "User not found" });
            }
            
            // Generate the QR Code URI
            string authenticatorKey = await _userManager.GetAuthenticatorKeyAsync(user);
            if (string.IsNullOrEmpty(authenticatorKey))
            {
                await _userManager.ResetAuthenticatorKeyAsync(user);
                authenticatorKey = await _userManager.GetAuthenticatorKeyAsync(user);
            }
            
            string email = await _userManager.GetEmailAsync(user);
            string appName = "Intex2MovieApp";
            
            // Format the QR code URL for the authenticator app
            string authenticatorUri = $"otpauth://totp/{WebUtility.UrlEncode(appName)}:{WebUtility.UrlEncode(email)}?secret={authenticatorKey}&issuer={WebUtility.UrlEncode(appName)}&digits=6";
            
            // Generate recovery codes
            var recoveryCodes = await _userManager.GenerateNewTwoFactorRecoveryCodesAsync(user, 10);
            
            return Ok(new TwoFactorSetupModel
            {
                SharedKey = authenticatorKey,
                AuthenticatorUri = authenticatorUri,
                RecoveryCodes = recoveryCodes?.ToArray(),
                Success = true,
                Message = "Two-factor authentication setup is ready"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting up two-factor authentication");
            return StatusCode(500, new { Message = "Error setting up two-factor authentication", Error = ex.Message });
        }
    }
    
    [HttpPost]
    [Route("verify-authenticator")]
    [Authorize]
    public async Task<IActionResult> VerifyAuthenticator([FromBody] TwoFactorVerifyModel model)
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { Success = false, Message = "User not found" });
            }
            
            // Verify the code
            bool isValid = await _userManager.VerifyTwoFactorTokenAsync(
                user, 
                _userManager.Options.Tokens.AuthenticatorTokenProvider, 
                model.Code);
                
            if (!isValid)
            {
                return BadRequest(new { Success = false, Message = "Invalid verification code" });
            }
            
            // Enable 2FA for the user
            await _userManager.SetTwoFactorEnabledAsync(user, true);
            
            return Ok(new { Success = true, Message = "Two-factor authentication has been enabled" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying authenticator code");
            return StatusCode(500, new { Success = false, Message = "Error verifying authenticator code", Error = ex.Message });
        }
    }
    
    [HttpPost]
    [Route("two-factor-verify")]
    [AllowAnonymous]
    public async Task<IActionResult> VerifyTwoFactorCode([FromBody] TwoFactorVerifyModel model)
    {
        try
        {
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
            {
                return Unauthorized(new AuthResponse
                {
                    Success = false,
                    Message = "Invalid user"
                });
            }

            // Verify the 2FA code
            var isValid = await _userManager.VerifyTwoFactorTokenAsync(
                user, 
                TokenOptions.DefaultAuthenticatorProvider, 
                model.Code);

            if (!isValid)
            {
                return Unauthorized(new AuthResponse
                {
                    Success = false,
                    Message = "Invalid two-factor code"
                });
            }

            // Generate the final token
            var authClaims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, user.UserName),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.NameIdentifier, user.Id)
            };

            if (user.MoviesUserId.HasValue)
            {
                authClaims.Add(new Claim("MoviesUserId", user.MoviesUserId.Value.ToString()));
            }

            var token = GetToken(authClaims);

            // Set auth cookie
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = token.ValidTo
            };
            Response.Cookies.Append("authToken", new JwtSecurityTokenHandler().WriteToken(token), cookieOptions);
            Response.Cookies.Append("userEmail", user.Email, cookieOptions);
            Response.Cookies.Append("userId", user.Id, cookieOptions);
            if (user.MoviesUserId.HasValue)
            {
                Response.Cookies.Append("moviesUserId", user.MoviesUserId.Value.ToString(), cookieOptions);
            }

            return Ok(new AuthResponse
            {
                Token = new JwtSecurityTokenHandler().WriteToken(token),
                Expiration = token.ValidTo,
                Success = true,
                Message = "Two-factor authentication successful"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during two-factor verification");
            return StatusCode(500, new AuthResponse
            {
                Success = false,
                Message = "An error occurred during two-factor verification"
            });
        }
    }
    
    [HttpPost]
    [Route("disable-two-factor")]
    [Authorize]
    public async Task<IActionResult> DisableTwoFactor()
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { Success = false, Message = "User not found" });
            }
            
            // Disable 2FA
            var result = await _userManager.SetTwoFactorEnabledAsync(user, false);
            if (!result.Succeeded)
            {
                return BadRequest(new { 
                    Success = false, 
                    Message = "Failed to disable two-factor authentication",
                    Errors = result.Errors.Select(e => e.Description)
                });
            }
            
            // Reset the authenticator key
            await _userManager.ResetAuthenticatorKeyAsync(user);
            
            return Ok(new { Success = true, Message = "Two-factor authentication has been disabled" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error disabling two-factor authentication");
            return StatusCode(500, new { Success = false, Message = "Error disabling two-factor authentication", Error = ex.Message });
        }
    }

    [HttpGet]
    [Route("manual-admin-check")]
    [AllowAnonymous]
    public async Task<IActionResult> ManualAdminCheck(string email)
    {
        try
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                return NotFound(new { message = $"User with email {email} not found." });
            }

            var roles = await _userManager.GetRolesAsync(user);
            var isInAdminRole = roles.Contains("Administrator");
            
            // Get MoviesUser info if available
            string moviesUserAdmin = "N/A";
            if (user.MoviesUserId.HasValue)
            {
                var moviesUser = await _context.MoviesUsers.FindAsync(user.MoviesUserId);
                if (moviesUser != null)
                {
                    moviesUserAdmin = moviesUser.Admin == 1 ? "Yes" : "No";
                }
            }
            
            return Ok(new
            {
                email = user.Email,
                id = user.Id,
                moviesUserId = user.MoviesUserId,
                isInAdminRole = isInAdminRole,
                roles = roles,
                adminInDatabase = moviesUserAdmin,
                message = "User admin status retrieved successfully."
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace });
        }
    }

    [HttpPost]
    [Route("assign-admin-role")]
    [AllowAnonymous] // Be careful with this in production - should be restricted
    public async Task<IActionResult> AssignAdminRole(string email)
    {
        try
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                return NotFound(new { message = $"User with email {email} not found." });
            }

            // Check if user has MoviesUserId
            if (!user.MoviesUserId.HasValue)
            {
                return BadRequest(new { message = "User does not have a linked MoviesUser record." });
            }

            // Update the movies_users table to set admin=1
            var moviesUser = await _context.MoviesUsers.FindAsync(user.MoviesUserId);
            if (moviesUser == null)
            {
                return BadRequest(new { message = "MoviesUser record not found." });
            }

            moviesUser.Admin = 1;
            await _context.SaveChangesAsync();
            
            // Add user to Administrator role
            if (!await _userManager.IsInRoleAsync(user, "Administrator"))
            {
                var result = await _userManager.AddToRoleAsync(user, "Administrator");
                if (!result.Succeeded)
                {
                    return BadRequest(new { message = "Failed to add user to Administrator role.", errors = result.Errors });
                }
            }
            
            // Create a new token with admin privileges
            var authClaims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, user.UserName),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Role, "Administrator")
            };
            
            if (user.MoviesUserId.HasValue)
            {
                authClaims.Add(new Claim("MoviesUserId", user.MoviesUserId.Value.ToString()));
            }
            
            var token = GetToken(authClaims);
            
            return Ok(new
            {
                message = "User assigned to Administrator role successfully.",
                token = new JwtSecurityTokenHandler().WriteToken(token),
                expiration = token.ValidTo
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace });
        }
    }

    private string GenerateRefreshToken()
    {
        var randomNumber = new byte[32];
        using (var rng = System.Security.Cryptography.RandomNumberGenerator.Create())
        {
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }
    }

    private ClaimsPrincipal GetPrincipalFromExpiredToken(string token)
    {
        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = false,
            ValidateIssuer = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JWT:Secret"])),
            ValidateLifetime = false
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        SecurityToken securityToken;
        var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out securityToken);
        var jwtSecurityToken = securityToken as JwtSecurityToken;
        if (jwtSecurityToken == null || !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            throw new SecurityTokenException("Invalid token");

        return principal;
    }

    private JwtSecurityToken GetToken(List<Claim> authClaims)
    {
        try
        {
            var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET") ?? 
                _configuration["JWT:Secret"] ?? 
                "JWTAuthenticationSecretKey123456789";
                
            var issuer = Environment.GetEnvironmentVariable("JWT_VALID_ISSUER") ?? 
                _configuration["JWT:ValidIssuer"] ?? 
                "http://localhost:5000";
                
            var audience = Environment.GetEnvironmentVariable("JWT_VALID_AUDIENCE") ?? 
                _configuration["JWT:ValidAudience"] ?? 
                "http://localhost:3000";
            
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