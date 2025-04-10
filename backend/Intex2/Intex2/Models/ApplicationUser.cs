using System;
using Microsoft.AspNetCore.Identity;

namespace Intex2.Models;

public class ApplicationUser : IdentityUser
{
    public int? MoviesUserId { get; set; }
    public virtual MoviesUser MoviesUser { get; set; }
    
    // Refresh token fields
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiryTime { get; set; }
} 