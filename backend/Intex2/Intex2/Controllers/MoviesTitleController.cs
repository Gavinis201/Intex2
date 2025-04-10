using Intex2.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Text.RegularExpressions;

namespace Intex2.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class MoviesTitleController : ControllerBase
    {
        private readonly MoviesDBContext _context;

        public MoviesTitleController(MoviesDBContext context)
        {
            _context = context;
        }

        private int LevenshteinDistance(string s1, string s2)
        {
            int[,] distance = new int[s1.Length + 1, s2.Length + 1];

            for (int i = 0; i <= s1.Length; i++)
                distance[i, 0] = i;
            for (int j = 0; j <= s2.Length; j++)
                distance[0, j] = j;

            for (int i = 1; i <= s1.Length; i++)
            {
                for (int j = 1; j <= s2.Length; j++)
                {
                    int cost = (s1[i - 1] == s2[j - 1]) ? 0 : 1;
                    distance[i, j] = Math.Min(
                        Math.Min(distance[i - 1, j] + 1, distance[i, j - 1] + 1),
                        distance[i - 1, j - 1] + cost);
                }
            }

            return distance[s1.Length, s2.Length];
        }

        [HttpGet("AllMovies")]
        public async Task<ActionResult<IEnumerable<MoviesTitle>>> GetAllMovies(
            [FromQuery] int pageSize = 10, 
            [FromQuery] int pageNum = 1, 
            [FromQuery] string genres = null, 
            [FromQuery] string search = null)
        {
            var query = _context.MoviesTitles.AsQueryable();

            // Filter by genre if provided
            if (!string.IsNullOrWhiteSpace(genres))
            {
                var genreList = genres.Split(',');
                foreach (var genre in genreList)
                {
                    var propertyName = genre.Trim();
                    query = query.Where(m => EF.Property<int?>(m, propertyName) == 1);
                }
            }

            // Filter by search term if provided
            if (!string.IsNullOrWhiteSpace(search))
            {
                var loweredSearch = search.ToLower();
                var searchWords = loweredSearch.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
                
                // First try exact matches
                var exactMatches = await query
                    .Where(m => m.Title.ToLower().Contains(loweredSearch))
                    .ToListAsync();

                if (exactMatches.Any())
                {
                    return Ok(new
                    {
                        movies = exactMatches,
                        totalNumMovies = exactMatches.Count
                    });
                }

                // If no exact matches, try fuzzy search
                var allMovies = await query.ToListAsync();
                var fuzzyMatches = allMovies
                    .Select(m => new
                    {
                        Movie = m,
                        Distance = LevenshteinDistance(m.Title.ToLower(), loweredSearch)
                    })
                    .Where(x => x.Distance <= 3) // Allow up to 3 character differences
                    .OrderBy(x => x.Distance)
                    .Select(x => x.Movie)
                    .ToList();

                return Ok(new
                {
                    movies = fuzzyMatches,
                    totalNumMovies = fuzzyMatches.Count
                });
            }

            var total = await query.CountAsync();
            var movies = await query
                .Skip((pageNum - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new
            {
                movies,
                totalNumMovies = total
            });
        }

        // GET: /MoviesTitle/{id}
        [HttpGet("{id}")]
        [AllowAnonymous] // Allow unauthenticated access to view movie details
        public async Task<ActionResult<MoviesTitle>> GetMoviesTitle(string id)
        {
            var movie = await _context.MoviesTitles.FindAsync(id);

            if (movie == null)
            {
                return NotFound();
            }

            return movie;
        }

        // POST: /MoviesTitle/AddMovie
        [HttpPost("AddMovie")]
        [Authorize(Roles = "Administrator")] // Require authentication for adding movies
        public async Task<ActionResult<MoviesTitle>> AddMovie(MoviesTitle movie)
        {
            _context.MoviesTitles.Add(movie);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMoviesTitle), new { id = movie.ShowId }, movie);
        }

        // PUT: /MoviesTitle/UpdateMovie/{id}
        [HttpPut("UpdateMovie/{id}")]
        [Authorize(Roles = "Administrator")] // Require authentication for updating movies
        public async Task<IActionResult> UpdateMovie(string id, MoviesTitle updatedMovie)
        {
            if (id != updatedMovie.ShowId)
            {
                return BadRequest("ID in URL does not match movie ID.");
            }

            _context.Entry(updatedMovie).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.MoviesTitles.Any(e => e.ShowId == id))
                {
                    return NotFound();
                }

                throw;
            }

            return NoContent();
        }

        // DELETE: /MoviesTitle/DeleteMovie/{id}
        [HttpDelete("DeleteMovie/{id}")]
        [Authorize(Roles = "Administrator")] // Require authentication for deleting movies
        public async Task<IActionResult> DeleteMovie(string id)
        {
            var movie = await _context.MoviesTitles.FindAsync(id);
            if (movie == null)
            {
                return NotFound();
            }

            _context.MoviesTitles.Remove(movie);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
