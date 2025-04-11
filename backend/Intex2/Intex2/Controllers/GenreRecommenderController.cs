using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text;
using Intex2.Models;

[Route("api/genre-recommender")]
[ApiController]
public class GenreRecommenderController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<GenreRecommenderController> _logger;

    public GenreRecommenderController(IConfiguration configuration, ILogger<GenreRecommenderController> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    [HttpPost("recommend")]
    public async Task<IActionResult> Recommend([FromBody] RecommendationRequest input)
    {
        try
        {
            _logger.LogInformation($"[INFO] Genre request received: title={input.title}, top_n={input.top_n}");

            var endpoint = Environment.GetEnvironmentVariable("GENRE_RECOMMENDER_URL");
            var apiKey = Environment.GetEnvironmentVariable("GENRE_RECOMMENDER_TOKEN");

            if (string.IsNullOrEmpty(endpoint))
            {
                _logger.LogError("Genre recommender endpoint not configured");
                return StatusCode(500, "Genre recommender endpoint not configured");
            }

            // Create a new HttpClient for this request
            using var httpClient = new HttpClient();
            
            httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            httpClient.DefaultRequestHeaders.Add("azureml-model-deployment", "default");

            // Convert from our API format to the format expected by Azure ML
            var azureRequest = new GenreMLRequest
            {
                movie_title = input.title,
                top_n = input.top_n
            };
            
            var jsonPayload = JsonSerializer.Serialize(azureRequest);
            var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

            _logger.LogInformation($"[INFO] Sending to Azure ML: {jsonPayload}");
            _logger.LogInformation($"[INFO] Azure ML Endpoint: {endpoint}");

            // Ensure endpoint is an absolute URI
            if (!Uri.TryCreate(endpoint, UriKind.Absolute, out Uri endpointUri))
            {
                _logger.LogError($"Invalid endpoint URI: {endpoint}");
                return StatusCode(500, $"Invalid endpoint URI format: {endpoint}");
            }

            var response = await httpClient.PostAsync(endpointUri, content);
            var responseString = await response.Content.ReadAsStringAsync();

            _logger.LogInformation($"[INFO] AzureML Genre Status: {response.StatusCode}");
            _logger.LogInformation($"[INFO] AzureML Genre Response: {responseString}");

            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode, responseString);
            }

            return Content(responseString, "application/json");
        }
        catch (Exception ex)
        {
            _logger.LogError($"[ERROR] {ex.Message}\n{ex.StackTrace}");
            return StatusCode(500, $"Internal Server Error: {ex.Message}");
        }
    }
}