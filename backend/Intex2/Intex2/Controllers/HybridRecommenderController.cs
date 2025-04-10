using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text;

[Route("api/hybrid-recommender")]
[ApiController]
public class HybridRecommenderController : ControllerBase
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<HybridRecommenderController> _logger;

    public HybridRecommenderController(ILogger<HybridRecommenderController> logger)
    {
        _httpClient = new HttpClient();
        _logger = logger;
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
            Console.WriteLine($"[INFO] Hybrid recommendation request received: show_id={input.show_id}, top_n={input.top_n}");

            var endpoint = "https://hybrid-movie-endpoint.eastus2.inference.ml.azure.com/score";
            var apiKey = "8Mz28Ww9OZqPTV6bco5HWBwIiQh8mqMXjpBBLKoBfbVcOzZ4arNoJQQJ99BDAAAAAAAAAAAAINFRAZML3ZeN";

            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            _httpClient.DefaultRequestHeaders.Add("azureml-model-deployment", "default");

            var jsonPayload = JsonSerializer.Serialize(input);
            var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

            _logger.LogInformation($"[INFO] Sending to Azure ML: {jsonPayload}");
            var response = await _httpClient.PostAsync(endpoint, content);
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