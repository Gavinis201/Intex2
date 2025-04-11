using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Intex2.Models;

namespace Intex2.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RatingsController : ControllerBase
    {
        private readonly MoviesDBContext _context;

        public RatingsController(MoviesDBContext context)
        {
            _context = context;
        }

        // GET: api/ratings/user/{userId}
        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<MoviesRating>>> GetRatingsByUser(int userId)
        {
            var ratings = await _context.MoviesRatings
                .Where(r => r.UserId == userId)
                .ToListAsync();

            return Ok(ratings);
        }

        // GET: api/ratings/{userId}/{movieId}
        [HttpGet("{userId}/{movieId}")]
        public async Task<ActionResult<MoviesRating>> GetRating(int userId, string movieId)
        {
            var rating = await _context.MoviesRatings
                .FirstOrDefaultAsync(r => r.UserId == userId && r.ShowId == movieId);

            if (rating == null)
            {
                return NotFound();
            }

            return Ok(rating);
        }

        // POST: api/ratings
        [HttpPost]
        public async Task<ActionResult<MoviesRating>> PostRating([FromBody] MoviesRating rating)
        {
            // Check if a rating for this user and movie already exists
            var existingRating = await _context.MoviesRatings
                .FirstOrDefaultAsync(r => r.UserId == rating.UserId && r.ShowId == rating.ShowId);

            try
            {
                if (existingRating != null)
                {
                    // Update existing rating using raw SQL
                    await _context.Database.ExecuteSqlRawAsync(
                        "UPDATE movies_ratings SET rating = {0} WHERE user_id = {1} AND show_id = {2}",
                        rating.Rating, rating.UserId, rating.ShowId);
                }
                else
                {
                    // Insert new rating using raw SQL
                    await _context.Database.ExecuteSqlRawAsync(
                        "INSERT INTO movies_ratings (user_id, show_id, rating) VALUES ({0}, {1}, {2})",
                        rating.UserId, rating.ShowId, rating.Rating);
                }

                return Ok(new { userId = rating.UserId, showId = rating.ShowId, rating = rating.Rating });
            }
            catch (Exception ex)
            {
                return BadRequest($"Could not save rating to database: {ex.Message}");
            }
        }

        // DELETE: api/ratings/{userId}/{movieId}
        [HttpDelete("{userId}/{movieId}")]
        public async Task<IActionResult> DeleteRating(int userId, string movieId)
        {
            try
            {
                // Check if the rating exists first
                var rating = await _context.MoviesRatings
                    .FirstOrDefaultAsync(r => r.UserId == userId && r.ShowId == movieId);

                if (rating == null)
                {
                    return NotFound();
                }

                // Delete using raw SQL
                await _context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM movies_ratings WHERE user_id = {0} AND show_id = {1}",
                    userId, movieId);

                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest($"Could not delete rating: {ex.Message}");
            }
        }
    }
} 