using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text;

[Route("api/hybrid-recommender")]
[ApiController]
public class HybridRecommenderController : ControllerBase
{
    private readonly ILogger<HybridRecommenderController> _logger;
    private readonly IConfiguration _configuration;

    public HybridRecommenderController(ILogger<HybridRecommenderController> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    public class HybridRecommendationRequest
    {
        public string show_id { get; set; }
        public int? user_id { get; set; }
        public int top_n { get; set; } = 5;
    }

    [HttpPost("recommend")]
    public async Task<IActionResult> Recommend([FromBody] HybridRecommendationRequest input)
    {
        try
        {
            _logger.LogInformation($"[INFO] Hybrid recommendation request received: show_id={input.show_id}, top_n={input.top_n}");

            var endpoint = Environment.GetEnvironmentVariable("HYBRID_RECOMMENDER_URL");
            var apiKey = Environment.GetEnvironmentVariable("HYBRID_RECOMMENDER_TOKEN");

            if (string.IsNullOrEmpty(endpoint))
            {
                _logger.LogError("Hybrid recommender endpoint not configured");
                return StatusCode(500, "Hybrid recommender endpoint not configured");
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

            _logger.LogInformation($"[INFO] Azure ML Status: {response.StatusCode}");
            _logger.LogInformation($"[INFO] Azure ML Response: {responseString}");

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