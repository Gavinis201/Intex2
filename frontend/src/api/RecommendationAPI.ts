// Recommendation API service

interface RecommendationRequestParams {
  show_id: string;
  user_id?: number | null;
  top_n?: number;
}

interface RecommendationResult {
  show_id: string;
  title: string;
  description: string;
  movie_poster?: string;
}

// Config for recommendations API
const config = {
  // Azure ML endpoint
  azure: {
    enabled: true, // Set to false to disable Azure endpoint
    url: "https://hybrid-movie-endpoint.eastus2.inference.ml.azure.com/score",
    token: "8Mz28Ww9OZqPTV6bco5HWBwIiQh8mqMXjpBBLKoBfbVcOzZ4arNoJQQJ99BDAAAAAAAAAAAAINFRAZML3ZeN",
    deploymentName: "default"
  },
  // Local fallback endpoint
  local: {
    url: "https://localhost:5000/api/hybrid-recommender/recommend"
  }
};

/**
 * Get movie recommendations using either Azure ML endpoint or local fallback
 */
export const getRecommendations = async (
  params: RecommendationRequestParams
): Promise<RecommendationResult[]> => {
  const { show_id, user_id, top_n = 5 } = params;

  // Try Azure endpoint first if enabled
  if (config.azure.enabled) {
    try {
      console.log(`Fetching recommendations from Azure ML for movie ID: ${show_id}`);
      const response = await fetch(config.azure.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.azure.token}`,
          "azureml-model-deployment": config.azure.deploymentName
        },
        body: JSON.stringify({
          show_id,
          user_id: user_id || null,
          top_n
        }),
      });

      if (!response.ok) {
        console.warn(`Azure ML endpoint returned ${response.status}: ${response.statusText}`);
        throw new Error(`Azure ML endpoint error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Recommendations received from Azure:', data);
      return data;
    } catch (error) {
      console.error('Azure endpoint failed, falling back to local API:', error);
    }
  }

  // Fallback to local API
  console.log(`Fetching recommendations from local API for movie ID: ${show_id}`);
  const response = await fetch(config.local.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      show_id,
      user_id: user_id || null,
      top_n
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch recommendations: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log('Recommendations received from local API:', data);
  return data;
}; 