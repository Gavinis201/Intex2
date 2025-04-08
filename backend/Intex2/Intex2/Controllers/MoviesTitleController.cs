using Intex2.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoviesDBContext = Intex2.Models.MoviesDBContext;

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

        // GET: /MoviesTitle/AllMovies?pageSize=10&pageNum=1&genres=action&genres=drama
        [HttpGet("AllMovies")]
        public async Task<ActionResult<IEnumerable<MoviesTitle>>> GetAllMovies([FromQuery] int pageSize = 10, [FromQuery] int pageNum = 1, [FromQuery] List<string> genres = null)
        {
            var query = _context.MoviesTitles.AsQueryable();

            if (genres != null && genres.Any())
            {
                foreach (var genre in genres)
                {
                    query = query.Where(m =>
                        EF.Property<int?>(m, genre) == 1);
                }
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
        public async Task<ActionResult<MoviesTitle>> AddMovie(MoviesTitle movie)
        {
            _context.MoviesTitles.Add(movie);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMoviesTitle), new { id = movie.ShowId }, movie);
        }

        // PUT: /MoviesTitle/UpdateMovie/{id}
        [HttpPut("UpdateMovie/{id}")]
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
