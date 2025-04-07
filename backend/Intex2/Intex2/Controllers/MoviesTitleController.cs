using Intex2.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Intex2.Controllers;

[ApiController]
[Route("[controller]")]
public class MoviesTitleController : ControllerBase
{
    private readonly MoviesDBContext _context;

    public MoviesTitleController(MoviesDBContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<MoviesTitle>>> GetMoviesTitles()
    {
        return await _context.MoviesTitles.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<MoviesTitle>> GetMoviesTitle(string id)
    {
        var moviesTitle = await _context.MoviesTitles.FindAsync(id);

        if (moviesTitle == null)
        {
            return NotFound();
        }

        return moviesTitle;
    }
}