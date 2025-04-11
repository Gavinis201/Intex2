using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text;
using Intex2.Models;

[Route("api/[controller]")]
[ApiController]
public class RecommenderController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<RecommenderController> _logger;

    public RecommenderController(IConfiguration configuration, ILogger<RecommenderController> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    // Removed internal RecommendationRequest class - now using shared model

    [HttpPost("recommend")]
    public async Task<IActionResult> Recommend([FromBody] RecommendationRequest input)
    {
        try
        {
            _logger.LogInformation($"[INFO] Request received: title={input.title}, top_n={input.top_n}");

            var endpoint = Environment.GetEnvironmentVariable("MOVIE_RECOMMENDER_URL");
            var apiKey = Environment.GetEnvironmentVariable("MOVIE_RECOMMENDER_TOKEN");

            if (string.IsNullOrEmpty(endpoint))
            {
                _logger.LogError("Movie recommender endpoint not configured");
                return StatusCode(500, "Movie recommender endpoint not configured");
            }

            // Create a new HttpClient for this request
            using var httpClient = new HttpClient();
            
            httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            httpClient.DefaultRequestHeaders.Add("azureml-model-deployment", "default");

            var jsonPayload = JsonSerializer.Serialize(input);
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

            _logger.LogInformation($"[INFO] AzureML Status: {response.StatusCode}");
            _logger.LogInformation($"[INFO] AzureML Response: {responseString}");

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