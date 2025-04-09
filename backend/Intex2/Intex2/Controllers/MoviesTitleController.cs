using Intex2.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

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

        // GET: /MoviesTitle/AllMovies?pageSize=10&pageNum=1&genres=action&search=batman
        [HttpGet("AllMovies")]
        public async Task<ActionResult<IEnumerable<MoviesTitle>>> GetAllMovies([FromQuery] int pageSize = 10, [FromQuery] int pageNum = 1, [FromQuery] List<string> genres = null, [FromQuery] string search = null)
        {
            var query = _context.MoviesTitles.AsQueryable();

            // Filter by genre if provided
            if (genres != null && genres.Any())
            {
                foreach (var genre in genres)
                {
                    query = query.Where(m => EF.Property<int?>(m, genre) == 1);
                }
            }

            // Filter by search term if provided
            if (!string.IsNullOrWhiteSpace(search))
            {
                var loweredSearch = search.ToLower();
                query = query.Where(m => m.Title.ToLower().Contains(loweredSearch));
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
        [Authorize(Roles = "admin")] // Require authentication for adding movies
        public async Task<ActionResult<MoviesTitle>> AddMovie(MoviesTitle movie)
        {
            _context.MoviesTitles.Add(movie);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMoviesTitle), new { id = movie.ShowId }, movie);
        }

        // PUT: /MoviesTitle/UpdateMovie/{id}
        [HttpPut("UpdateMovie/{id}")]
        [Authorize(Roles = "admin")] // Require authentication for updating movies
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
        [Authorize(Roles = "admin")] // Require authentication for deleting movies
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
