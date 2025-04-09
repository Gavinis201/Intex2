using System;
using Microsoft.AspNetCore.Identity;

namespace Intex2.Models;

public class ApplicationUser : IdentityUser
{
    public int? MoviesUserId { get; set; }
    public virtual MoviesUser MoviesUser { get; set; }
} 