using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text;
using Intex2.Models;

[Route("api/[controller]")]
[ApiController]
public class RecommenderController : ControllerBase
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public RecommenderController(IConfiguration configuration)
    {
        _httpClient = new HttpClient();
        _configuration = configuration;
    }

    // Removed internal RecommendationRequest class - now using shared model

    [HttpPost("recommend")]
    public async Task<IActionResult> Recommend([FromBody] RecommendationRequest input)
    {
        try
        {
            Console.WriteLine($"[INFO] Request received: title={input.title}, top_n={input.top_n}");

            var endpoint = "https://movie-rec-endpoint.eastus2.inference.ml.azure.com/score";
            var apiKey = "6oAkDYrWpPej06uZXLopPAxLEnsNfg68RJQPhYBVbde2YcaYU5NBJQQJ99BDAAAAAAAAAAAAINFRAZML2iWA";

            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            _httpClient.DefaultRequestHeaders.Add("azureml-model-deployment", "default");

            var jsonPayload = JsonSerializer.Serialize(input);
            var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(endpoint, content);
            var responseString = await response.Content.ReadAsStringAsync();

            Console.WriteLine($"[INFO] AzureML Status: {response.StatusCode}");
            Console.WriteLine($"[INFO] AzureML Response: {responseString}");

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