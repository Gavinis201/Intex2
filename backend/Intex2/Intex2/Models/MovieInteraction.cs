using System;
using System.Text.Json.Serialization;

namespace Intex2.Models
{
    public class MovieInteraction
    {
        [JsonPropertyName("showId")]
        public string ShowId { get; set; }
        
        [JsonPropertyName("interactionType")]
        public string InteractionType { get; set; }  // "click", "view", "rate", etc.
        
        [JsonPropertyName("timestamp")]
        public string Timestamp { get; set; }
        
        [JsonPropertyName("userId")]
        public string? UserId { get; set; } // Optional, can be used if user is logged in
    }
} 