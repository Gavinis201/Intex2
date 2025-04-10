using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using Intex2.Models;
using System;
using Microsoft.Extensions.Logging;

[Route("api/movieinteractions")]
[ApiController]
public class MovieInteractionsController : ControllerBase
{
    private readonly ILogger<MovieInteractionsController> _logger;

    public MovieInteractionsController(ILogger<MovieInteractionsController> logger)
    {
        _logger = logger;
    }

    [HttpPost("click")]
    public IActionResult LogMovieClick([FromBody] MovieInteraction interaction)
    {
        try
        {
            // Log the raw request for debugging
            var requestJson = JsonSerializer.Serialize(interaction);
            Console.WriteLine($"[DEBUG] Received movie click request: {requestJson}");
            
            if (string.IsNullOrEmpty(interaction.ShowId))
            {
                _logger.LogWarning("Movie click request rejected - ShowId is missing");
                return BadRequest(new { success = false, message = "ShowId is required" });
            }

            // Log movie click to console
            _logger.LogInformation($"Movie click logged - ShowId: {interaction.ShowId}, Type: {interaction.InteractionType}, Time: {interaction.Timestamp}");
            Console.WriteLine($"[INFO] Movie click event - ShowId: {interaction.ShowId}, Time: {interaction.Timestamp}");

            // Here you could also save this interaction to a database
            // For now we're just logging to the console which will appear in the backend terminal

            return Ok(new { success = true, message = "Movie click logged successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error logging movie click");
            Console.WriteLine($"[ERROR] Failed to log movie click: {ex.Message}");
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    // You can add more endpoints for other interaction types if needed
    // e.g., view duration, favorites, etc.
} 