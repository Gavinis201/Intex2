using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text;
using Intex2.Models;

[Route("api/genre-recommender")]
[ApiController]
public class GenreRecommenderController : ControllerBase
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public GenreRecommenderController(IConfiguration configuration)
    {
        _httpClient = new HttpClient();
        _configuration = configuration;
    }

    [HttpPost("recommend")]
    public async Task<IActionResult> Recommend([FromBody] RecommendationRequest input)
    {
        try
        {
            Console.WriteLine($"[INFO] Genre request received: title={input.title}, top_n={input.top_n}");

            var endpoint = _configuration["GENRE_RECOMMENDER_URL"];
            var apiKey = _configuration["GENRE_RECOMMENDER_TOKEN"];

            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            _httpClient.DefaultRequestHeaders.Add("azureml-model-deployment", "default");

            // Convert from our API format to the format expected by Azure ML
            var azureRequest = new GenreMLRequest
            {
                movie_title = input.title,
                top_n = input.top_n
            };
            
            var jsonPayload = JsonSerializer.Serialize(azureRequest);
            var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

            Console.WriteLine($"[INFO] Sending to Azure ML: {jsonPayload}");
            var response = await _httpClient.PostAsync(endpoint, content);
            var responseString = await response.Content.ReadAsStringAsync();

            Console.WriteLine($"[INFO] AzureML Genre Status: {response.StatusCode}");
            Console.WriteLine($"[INFO] AzureML Genre Response: {responseString}");

            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode, responseString);
            }

            return Content(responseString, "application/json");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ERROR] {ex.Message}\n{ex.StackTrace}");
            return StatusCode(500, $"Internal Server Error: {ex.Message}");
        }
    }
}