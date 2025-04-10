import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './SearchPage.css';
import Pagination from './Pagination';
import comingSoon from '../assets/images/ComingSoon.png';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

type Movie = {
  showId: string;
  title: string;
  type: string;
  director: string;
  cast: string;
  country: string;
  releaseYear: number;
  rating: string;
  duration: string;
  description: string;
  movie_poster: string;
};

type Recommendation = {
  title: string;
  similarity: number;
  movie_poster?: string;
};

function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('query') || '';
  const [movies, setMovies] = useState<Movie[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [genreRecommendations, setGenreRecommendations] = useState<
    Recommendation[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [loadingGenreRecs, setLoadingGenreRecs] = useState(false);
  const [error, setError] = useState('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [pageNum, setPageNum] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const [flippedRecCards, setFlippedRecCards] = useState<Set<string>>(
    new Set()
  );

  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `https://localhost:5000/MoviesTitle/AllMovies?pageSize=${pageSize}&pageNum=${pageNum}&search=${encodeURIComponent(query)}`
      );
      setMovies(response.data.movies || []);
      setTotalPages(Math.ceil(response.data.totalNumMovies / pageSize));
      setError('');
    } catch (err) {
      console.error('Error fetching movies:', err);
      setError('Failed to fetch movies. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    if (!query) return;

    try {
      setLoadingRecs(true);
      const response = await fetch(
        'https://localhost:5000/api/recommender/recommend',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: query, top_n: 10 }),
        }
      );

      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const data = await response.json();

      const withPosters = await Promise.all(
        data.map(async (rec: Recommendation) => {
          try {
            const res = await axios.get(
              `https://localhost:5000/MoviesTitle/AllMovies?search=${encodeURIComponent(rec.title)}`
            );
            const movie = res.data.movies?.[0];
            return { ...rec, movie_poster: movie?.movie_poster || comingSoon };
          } catch {
            return { ...rec, movie_poster: comingSoon };
          }
        })
      );

      setRecommendations(withPosters);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoadingRecs(false);
    }
  };

  const fetchGenreRecommendations = async () => {
    if (!query) {
      console.log('No query for genre recommendations');
      return;
    }

    try {
      setLoadingGenreRecs(true);
      console.log('Fetching genre recommendations for:', query);

      const requestBody = { title: query, top_n: 10 };
      console.log('Genre request body:', JSON.stringify(requestBody));

      const response = await fetch(
        'https://localhost:5000/api/genre-recommender/recommend',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        }
      );

      console.log('Genre API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Genre recommender error: ${response.status} - ${errorText}`
        );
        throw new Error(
          `Genre recommender returned ${response.status}: ${errorText}`
        );
      }

      // Read response as text first to log it
      const responseText = await response.text();
      console.log('Raw genre response:', responseText);

      let data;
      try {
        // Then parse it as JSON
        data = JSON.parse(responseText);
        console.log('Parsed genre recommendations:', data);
      } catch (jsonError) {
        console.error('Failed to parse genre response as JSON:', jsonError);
        throw new Error('Invalid JSON response from genre recommender');
      }

      // Check if data is an object with results property or an array
      let recommendationsArray = Array.isArray(data)
        ? data
        : data?.results
          ? data.results
          : data?.recommendations
            ? data.recommendations
            : null;

      if (!recommendationsArray) {
        console.error(
          'Unexpected response format from genre recommender:',
          data
        );
        setLoadingGenreRecs(false);
        return;
      }

      console.log('Extracted recommendations array:', recommendationsArray);

      if (recommendationsArray.length === 0) {
        console.log('No genre recommendations received');
        setLoadingGenreRecs(false);
        return;
      }

      const withPosters = await Promise.all(
        recommendationsArray.map(async (rec: any) => {
          // Normalize recommendation object structure
          const title =
            typeof rec === 'string' ? rec : rec.title || rec.movie_title || '';
          const similarity =
            typeof rec === 'object' ? rec.similarity || rec.score || 0.5 : 0.5;

          if (!title) {
            console.error('Invalid recommendation format:', rec);
            return null;
          }

          try {
            const res = await axios.get(
              `https://localhost:5000/MoviesTitle/AllMovies?search=${encodeURIComponent(title)}`
            );
            const movie = res.data.movies?.[0];
            return {
              title,
              similarity,
              movie_poster: movie?.movie_poster || comingSoon,
            };
          } catch (err) {
            console.error('Error fetching poster for genre rec:', title, err);
            return { title, similarity, movie_poster: comingSoon };
          }
        })
      );

      // Filter out any null entries
      const validRecommendations = withPosters.filter(Boolean);

      console.log(
        'Final genre recommendations with posters:',
        validRecommendations
      );

      // Force UI update with the new recommendations
      setGenreRecommendations([...validRecommendations]);
      console.log(
        'Genre recommendations state updated, length:',
        validRecommendations.length
      );

      // Add extra console log to verify the state
      setTimeout(() => {
        console.log('Current state after timeout:', {
          genreRecsLength: genreRecommendations.length,
          movies: genreRecommendations.map((r) => r.title).join(', '),
        });
      }, 500);

      // Force a window error if we got recommendations but aren't showing them
      if (validRecommendations.length > 0) {
        setTimeout(() => {
          if (genreRecommendations.length === 0) {
            console.error(
              '⚠️ State update failed! Recommendations not in state!'
            );
          } else {
            console.log(
              '✅ State update confirmed:',
              genreRecommendations.length,
              'items in state'
            );
          }
        }, 1000);
      }
    } catch (err) {
      console.error('Error fetching genre-based recommendations:', err);
    } finally {
      setLoadingGenreRecs(false);
    }
  };

  const toggleCard = (showId: string) => {
    setFlippedCards((prev) => {
      const newSet = new Set(prev);
      newSet.has(showId) ? newSet.delete(showId) : newSet.add(showId);
      return newSet;
    });
  };

  const toggleRecCard = (title: string) => {
    setFlippedRecCards((prev) => {
      const newSet = new Set(prev);
      newSet.has(title) ? newSet.delete(title) : newSet.add(title);
      return newSet;
    });
  };

  useEffect(() => {
    if (query) {
      console.log('Search query changed to:', query);
      fetchMovies();
      fetchRecommendations();

      // First try to fetch real genre recommendations
      const fetchGenre = async () => {
        try {
          await fetchGenreRecommendations();
        } catch (err) {
          console.error(
            'Failed to fetch genre recommendations, using fallback data',
            err
          );

          // Fallback to test data if the API call fails
          const testData = [
            {
              title: 'Test Fallback 1',
              similarity: 0.95,
              movie_poster: comingSoon,
            },
            {
              title: 'Test Fallback 2',
              similarity: 0.85,
              movie_poster: comingSoon,
            },
            {
              title: 'Test Fallback 3',
              similarity: 0.75,
              movie_poster: comingSoon,
            },
          ];
          setGenreRecommendations(testData);
        }
      };

      fetchGenre();
      console.log('All API fetch calls triggered');
    } else {
      setMovies([]);
      setRecommendations([]);
      setGenreRecommendations([]);
      setLoading(false);
    }
  }, [pageSize, pageNum, query]);

  useEffect(() => {
    setPageNum(1);
  }, [query]);

  return (
    <div className="search-page">
      <h1 className="search-title">Search Results for "{query}"</h1>

      {/* Make debug info visible */}
      <div
        style={{
          padding: '10px',
          margin: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: '#f9f9f9',
        }}
      >
        <h3>Debug Info</h3>
        <p>Has query: {query ? 'yes' : 'no'}</p>
        <p>Genre Recommendations Count: {genreRecommendations.length}</p>
        <p>Loading Genre Recs: {loadingGenreRecs.toString()}</p>
        <button
          onClick={() => {
            console.clear();
            fetchGenreRecommendations();
          }}
          style={{ padding: '5px 10px' }}
        >
          Force Fetch Genre Recommendations
        </button>
        <button
          onClick={() => {
            // Force display for testing
            const testData = [
              {
                title: 'Test Movie 1',
                similarity: 0.95,
                movie_poster: comingSoon,
              },
              {
                title: 'Test Movie 2',
                similarity: 0.85,
                movie_poster: comingSoon,
              },
              {
                title: 'Test Movie 3',
                similarity: 0.75,
                movie_poster: comingSoon,
              },
            ];
            setGenreRecommendations(testData);
            console.log('Set test data', testData);
          }}
          style={{ padding: '5px 10px', marginLeft: '10px' }}
        >
          Set Test Data
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : movies.length === 0 ? (
        <div className="no-results">No movies found matching your search.</div>
      ) : (
        <>
          <div className="carousel-container">
            <Slider {...carouselSettings}>
              {movies.map((movie) => (
                <div key={movie.showId} className="carousel-item">
                  <div
                    className={`movie-card ${flippedCards.has(movie.showId) ? 'flipped' : ''}`}
                    onClick={() => toggleCard(movie.showId)}
                  >
                    <div className="card-front">
                      <img
                        src={movie.movie_poster || comingSoon}
                        alt={movie.title}
                        className="movie-poster"
                      />
                    </div>
                    <div className="card-back">
                      <div className="movie-info">
                        <h3>{movie.title}</h3>
                        <p>
                          <strong>Year:</strong> {movie.releaseYear}
                        </p>
                        <p>
                          <strong>Rating:</strong> {movie.rating}
                        </p>
                        <p>
                          <strong>Duration:</strong> {movie.duration}
                        </p>
                        <p>
                          <strong>Director:</strong> {movie.director}
                        </p>
                        <p>
                          <strong>Description:</strong> {movie.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </Slider>
          </div>

          <Pagination
            currentPage={pageNum}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setPageNum}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPageNum(1);
            }}
          />

          {/* Content-based recommendations */}
          {recommendations.length > 0 && (
            <div className="recommendations-section">
              <h2 className="recommendations-title">You Might Also Like</h2>
              <div className="carousel-container">
                <Slider {...carouselSettings}>
                  {recommendations.map((rec) => (
                    <div key={rec.title} className="carousel-item">
                      <div
                        className={`movie-card ${flippedRecCards.has(rec.title) ? 'flipped' : ''}`}
                        onClick={() => toggleRecCard(rec.title)}
                      >
                        <div className="card-front">
                          <img
                            src={rec.movie_poster || comingSoon}
                            alt={rec.title}
                            className="movie-poster"
                          />
                        </div>
                        <div className="card-back">
                          <div className="movie-info">
                            <h3>{rec.title}</h3>
                            <p>
                              <strong>Similarity Score:</strong>{' '}
                              {rec.similarity.toFixed(3)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </Slider>
              </div>
            </div>
          )}

          {/* Genre-based recommendations section - ALWAYS render the container */}
          <div
            id="genre-recommendations"
            className="recommendations-section genre-recommendations"
            style={{ border: '3px solid red' }}
          >
            <h2 className="recommendations-title" style={{ color: '#e74c3c' }}>
              Similar by Genre{' '}
              {genreRecommendations.length > 0
                ? `(${genreRecommendations.length})`
                : '(None)'}
            </h2>

            {loadingGenreRecs ? (
              <div className="loading">Loading genre recommendations...</div>
            ) : genreRecommendations.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <p>No genre recommendations available</p>
                <p>
                  <small>Response count: {genreRecommendations.length}</small>
                </p>
                <button
                  onClick={fetchGenreRecommendations}
                  style={{ padding: '8px 16px', margin: '10px' }}
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="carousel-container">
                <Slider {...carouselSettings}>
                  {genreRecommendations.map((rec) => (
                    <div key={`${rec.title}-genre`} className="carousel-item">
                      <div
                        className={`movie-card genre-card ${flippedRecCards.has(`${rec.title}-genre`) ? 'flipped' : ''}`}
                        onClick={() => toggleRecCard(`${rec.title}-genre`)}
                      >
                        <div className="card-front">
                          <img
                            src={rec.movie_poster || comingSoon}
                            alt={rec.title}
                            className="movie-poster"
                          />
                          <div className="genre-badge">Genre</div>
                        </div>
                        <div className="card-back">
                          <div className="movie-info">
                            <h3>{rec.title}</h3>
                            <p>
                              <strong>Similarity Score:</strong>{' '}
                              {rec.similarity.toFixed(3)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </Slider>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default SearchPage;
