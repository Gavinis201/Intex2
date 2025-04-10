using System.ComponentModel.DataAnnotations;

namespace Intex2.Models;

public class LoginModel
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress]
    public string Email { get; set; }

    [Required(ErrorMessage = "Password is required")]
    public string Password { get; set; }
}

public class RegisterModel
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress]
    public string Email { get; set; }

    [Required(ErrorMessage = "Password is required")]
    [StringLength(100, ErrorMessage = "The {0} must be at least {2} characters long.", MinimumLength = 8)]
    [DataType(DataType.Password)]
    public string Password { get; set; }

    [DataType(DataType.Password)]
    [Compare("Password", ErrorMessage = "The password and confirmation password do not match.")]
    public string ConfirmPassword { get; set; }

    public int? UserId { get; set; }
}

public class AuthResponse
{
    public string Token { get; set; }
    public string RefreshToken { get; set; }
    public DateTime Expiration { get; set; }
    public bool Success { get; set; }
    public string Message { get; set; }
    public bool RequiresTwoFactor { get; set; }
}

public class RefreshTokenModel
{
    [Required]
    public string Token { get; set; }
    
    [Required]
    public string RefreshToken { get; set; }
}

public class ResetPasswordModel
{
    [Required]
    [EmailAddress]
    public string Email { get; set; }
    
    [Required]
    public string Token { get; set; }
    
    [Required]
    [StringLength(100, ErrorMessage = "The {0} must be at least {2} characters long.", MinimumLength = 8)]
    [DataType(DataType.Password)]
    public string NewPassword { get; set; }
    
    [DataType(DataType.Password)]
    [Compare("NewPassword", ErrorMessage = "The password and confirmation password do not match.")]
    public string ConfirmPassword { get; set; }
}

public class ForgotPasswordModel
{
    [Required]
    [EmailAddress]
    public string Email { get; set; }
}

public class TwoFactorVerifyModel
{
    [Required(ErrorMessage = "Verification code is required")]
    [StringLength(6, MinimumLength = 6, ErrorMessage = "Code must be 6 digits")]
    public string Code { get; set; }
    
    [Required]
    public string Email { get; set; }
    
    public bool RememberDevice { get; set; }
}

public class TwoFactorSetupModel
{
    public string SharedKey { get; set; }
    public string AuthenticatorUri { get; set; }
    public string[] RecoveryCodes { get; set; }
    public bool Success { get; set; }
    public string Message { get; set; }
} 