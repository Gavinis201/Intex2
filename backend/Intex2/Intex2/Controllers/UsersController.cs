using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Intex2.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2.Controllers;

[Route("api/[controller]")]
[ApiController]
public class UsersController : ControllerBase
{
    private readonly MoviesDBContext _context;

    public UsersController(MoviesDBContext context)
    {
        _context = context;
    }

    // GET: api/Users
    [HttpGet]
    [Authorize]
    public async Task<ActionResult<IEnumerable<MoviesUser>>> GetMoviesUsers()
    {
        return await _context.MoviesUsers.ToListAsync();
    }

    // GET: api/Users/5
    [HttpGet("{id}")]
    [Authorize]
    public async Task<ActionResult<MoviesUser>> GetMoviesUser(int id)
    {
        var moviesUser = await _context.MoviesUsers.FirstOrDefaultAsync(u => u.UserId == id);

        if (moviesUser == null)
        {
            return NotFound();
        }

        return moviesUser;
    }

    // POST: api/Users
    [HttpPost]
    [AllowAnonymous]
    public async Task<ActionResult<MoviesUser>> PostMoviesUser(MoviesUser moviesUser)
    {
        try
        {
            // Log incoming data
            Console.WriteLine($"Received user data: Email={moviesUser.Email}, Name={moviesUser.Name}");
            
            // Check if email already exists
            var existingUser = await _context.MoviesUsers.FirstOrDefaultAsync(u => u.Email == moviesUser.Email);
            if (existingUser != null)
            {
                Console.WriteLine($"User with email {moviesUser.Email} already exists");
                return Conflict(new { message = "A user with this email already exists." });
            }

            // Find the highest UserId and increment by 1
            var maxId = await _context.MoviesUsers.MaxAsync(u => (int?)u.UserId) ?? 0;
            moviesUser.UserId = maxId + 1;
            
            Console.WriteLine($"Creating user with ID: {moviesUser.UserId}");

            _context.MoviesUsers.Add(moviesUser);
            
            try
            {
                await _context.SaveChangesAsync();
                Console.WriteLine($"User created successfully with ID: {moviesUser.UserId}");
            }
            catch (DbUpdateException ex)
            {
                Console.WriteLine($"Database error: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
                return StatusCode(500, new { message = "Error creating user", error = ex.Message });
            }

            if (!moviesUser.UserId.HasValue)
            {
                Console.WriteLine("Error: User ID is null after save");
                return StatusCode(500, new { message = "Error generating user ID" });
            }

            return CreatedAtAction(nameof(GetMoviesUser), new { id = moviesUser.UserId.Value }, moviesUser);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Unexpected error: {ex.Message}");
            return StatusCode(500, new { message = "Unexpected error", error = ex.Message });
        }
    }

    // PUT: api/Users/5
    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> PutMoviesUser(int id, MoviesUser moviesUser)
    {
        if (!moviesUser.UserId.HasValue || id != moviesUser.UserId.Value)
        {
            return BadRequest();
        }

        _context.Entry(moviesUser).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!await _context.MoviesUsers.AnyAsync(e => e.UserId == id))
            {
                return NotFound();
            }
            else
            {
                throw;
            }
        }

        return NoContent();
    }

    // DELETE: api/Users/5
    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> DeleteMoviesUser(int id)
    {
        var moviesUser = await _context.MoviesUsers.FirstOrDefaultAsync(u => u.UserId == id);
        if (moviesUser == null)
        {
            return NotFound();
        }

        // Also check for linked authentication accounts and delete them
        var authUser = await _context.Users.FirstOrDefaultAsync(u => u.MoviesUserId == id);
        if (authUser != null)
        {
            _context.Users.Remove(authUser);
        }

        _context.MoviesUsers.Remove(moviesUser);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // GET: /api/users/check-admin/{id}
    [HttpGet("check-admin/{id}")]
    [AllowAnonymous]
    public async Task<ActionResult> CheckAdminStatus(int id)
    {
        try
        {
            var moviesUser = await _context.MoviesUsers.FindAsync(id);
            if (moviesUser == null)
            {
                return NotFound(new { isAdmin = false, message = "User not found" });
            }

            return Ok(new { isAdmin = moviesUser.Admin == 1 });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { isAdmin = false, error = ex.Message });
        }
    }
} 