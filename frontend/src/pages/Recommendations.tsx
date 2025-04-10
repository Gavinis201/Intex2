import { useState } from 'react';
type Recommendation = {
  title: string;
  similarity: number;
};
export default function RecommendationsPage() {
  const [title, setTitle] = useState('');
  const [results, setResults] = useState<Recommendation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fetchRecommendations = async () => {
    try {
      const response = await fetch(
        'https://localhost:5000/api/recommender/recommend',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: title,
            top_n: 10,
          }),
        }
      );
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      const data = await response.json();
      setResults(data);
      setError(null);
    } catch (err: any) {
      setError(
        'Failed to fetch recommendations. Make sure the backend is running and accessible.'
      );
      console.error(err);
    }
  };
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Movie Recommender</h1>
      <input
        type="text"
        placeholder='Enter Movie Title (e.g., "The Matrix")'
        className="border p-2 w-full mb-2"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <button
        onClick={fetchRecommendations}
        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
      >
        Get Recommendations
      </button>
      {error && <p className="text-red-500 mt-4">{error}</p>}
      <div className="mt-6 space-y-4">
        {results.map((rec, index) => (
          <div key={index} className="border rounded-lg p-4 shadow">
            <h2 className="text-lg font-semibold">{rec.title}</h2>
            <p className="text-sm text-gray-600">
              Similarity Score: {rec.similarity.toFixed(3)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}