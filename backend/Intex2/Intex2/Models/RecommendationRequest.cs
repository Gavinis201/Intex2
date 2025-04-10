namespace Intex2.Models
{
    // Shared request model for all recommendation controllers
    public class RecommendationRequest
    {
        public string title { get; set; }
        public int top_n { get; set; } = 5;
    }

    // Request expected by Azure ML Genre endpoint
    public class GenreMLRequest
    {
        public string movie_title { get; set; }
        public int top_n { get; set; }
    }
} 