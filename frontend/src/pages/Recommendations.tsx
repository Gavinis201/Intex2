import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './Recommendations.css';
import comingSoon from '../assets/images/ComingSoon.png';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import Cookies from 'js-cookie';

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
  genres?: string[];
  show_id?: string;
};

export default function RecommendationsPage() {
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
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [modalRecommendations, setModalRecommendations] = useState<
    Recommendation[]
  >([]);
  const [loadingModalRecs, setLoadingModalRecs] = useState(false);

  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    centerMode: false,
    centerPadding: '0px',
    responsive: [
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 900,
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
        `https://localhost:5000/MoviesTitle/AllMovies?search=${encodeURIComponent(query)}`
      );
      setMovies(response.data.movies || []);
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
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: query,
            top_n: 10,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      // Fetch movie posters for recommendations
      const recommendationsWithPosters = await Promise.all(
        data.map(async (rec: Recommendation) => {
          try {
            const movieResponse = await axios.get(
              `https://localhost:5000/MoviesTitle/AllMovies?search=${encodeURIComponent(rec.title)}`
            );
            const movie = movieResponse.data.movies?.[0];
            return {
              ...rec,
              movie_poster: movie?.movie_poster || comingSoon,
            };
          } catch (err) {
            return {
              ...rec,
              movie_poster: comingSoon,
            };
          }
        })
      );

      setRecommendations(recommendationsWithPosters);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoadingRecs(false);
    }
  };

  const fetchGenreRecommendations = async () => {
    if (!query) return;

    try {
      setLoadingGenreRecs(true);
      console.log('Fetching genre recommendations for:', query);

      const response = await fetch(
        'https://localhost:5000/api/genre-recommender/recommend',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: query,
            top_n: 10,
          }),
        }
      );

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
          const genres = rec.genres || [];

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
              genres,
              movie_poster: movie?.movie_poster || comingSoon,
            };
          } catch (err) {
            console.error('Error fetching poster for genre rec:', title, err);
            return { title, similarity, genres, movie_poster: comingSoon };
          }
        })
      );

      // Filter out any null entries
      const validRecommendations = withPosters.filter(Boolean);

      console.log(
        'Final genre recommendations with posters:',
        validRecommendations
      );

      // Set the genre recommendations
      setGenreRecommendations(validRecommendations);
    } catch (err) {
      console.error('Error fetching genre-based recommendations:', err);
    } finally {
      setLoadingGenreRecs(false);
    }
  };

  const handleCardClick = (movie: Movie) => {
    handleMovieClick(movie);
  };

  const handleRecCardClick = (recommendation: any) => {
    handleRecommendationClick(recommendation);
  };

  const getUserId = () => {
    const userId = Cookies.get('moviesUserId');
    return userId || '';
  };

  const fetchUserRatingForMovie = async (movieId: string) => {
    const userId = getUserId();
    if (!userId) return 0;

    try {
      const response = await fetch(
        `https://localhost:5000/api/ratings/${userId}/${movieId}`
      );
      if (!response.ok) {
        return 0;
      }

      const rating = await response.json();
      return rating.rating || 0;
    } catch (error) {
      console.error('Error fetching user rating for movie:', error);
      return 0;
    }
  };

  const handleMovieClick = async (movie: Movie) => {
    setSelectedMovie(movie);
    setHoverRating(0);

    // Fetch user's rating for this movie
    const rating = await fetchUserRatingForMovie(movie.showId);
    setUserRating(rating);

    // Fetch recommendations for this movie
    fetchModalRecommendations(movie.showId);

    // Log movie click
    logMovieClick(movie.showId);
  };

  const logMovieClick = async (movieId: string) => {
    try {
      console.log(`Sending movie click data to backend for ID: ${movieId}`);
      const response = await fetch(
        'https://localhost:5000/api/movieinteractions/click',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            showId: movieId,
            interactionType: 'click',
            timestamp: new Date().toISOString(),
          }),
        }
      );

      if (response.ok) {
        console.log(`Movie click logged successfully for ${movieId}`);
      } else if (response.status === 404) {
        console.warn(
          `Movie click endpoint not found (404). Make sure the backend controller is implemented.`
        );
      } else {
        console.error(
          `Failed to log movie click: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      console.error('Error logging movie click:', error);
    }
  };

  const fetchModalRecommendations = async (showId: string) => {
    setLoadingModalRecs(true);
    try {
      console.log(`Fetching recommendations for movie ID: ${showId}`);

      const response = await fetch(
        'https://localhost:5000/api/hybrid-recommender/recommend',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            show_id: showId,
            top_n: 5,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch recommendations: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log('Recommendations received:', data);

      // Map through the recommendations and try to find matching posters
      const enhancedRecommendations = await Promise.all(
        data.map(async (rec: any) => {
          try {
            // Normalize recommendation structure
            const recObj =
              typeof rec === 'string' ? { show_id: '', title: rec } : rec;

            // Try to find the movie in existing movies list
            const matchingMovie = movies.find(
              (m) =>
                m.title.toLowerCase() === recObj.title?.toLowerCase() ||
                m.showId === recObj.show_id
            );

            if (matchingMovie?.movie_poster) {
              return {
                ...recObj,
                movie_poster: matchingMovie.movie_poster,
              };
            }

            // If not found, fetch the movie details
            const movieResponse = await fetch(
              `https://localhost:5000/MoviesTitle/AllMovies?search=${encodeURIComponent(recObj.title || '')}`
            );
            if (movieResponse.ok) {
              const movieData = await movieResponse.json();
              const movie = movieData.movies?.[0];
              return {
                ...recObj,
                movie_poster: movie?.movie_poster || comingSoon,
              };
            }
            return {
              ...recObj,
              movie_poster: comingSoon,
            };
          } catch (error) {
            console.error('Error fetching movie poster:', error);
            return {
              ...rec,
              movie_poster: comingSoon,
            };
          }
        })
      );

      setModalRecommendations(enhancedRecommendations);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setModalRecommendations([]);
    } finally {
      setLoadingModalRecs(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedMovie(null);
    setModalRecommendations([]);
  };

  const handleRatingSubmit = async () => {
    if (!selectedMovie) return;

    const userId = getUserId();
    if (!userId) {
      alert('Please log in to rate movies');
      return;
    }

    try {
      const response = await fetch('https://localhost:5000/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          showId: selectedMovie.showId,
          rating: userRating,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit rating');
      }

      // Optional: show a success message
      alert('Rating submitted successfully!');
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Failed to submit rating. Please try again.');
    }
  };

  const handleRecommendationClick = async (recommendation: any) => {
    try {
      // Find the movie in movies first
      const movie = movies.find(
        (m) =>
          m.showId === recommendation.show_id ||
          m.title.toLowerCase() === recommendation.title.toLowerCase()
      );
      if (movie) {
        handleMovieClick(movie);
        return;
      }

      // If not found in movies, fetch the movie details
      const response = await fetch(
        `https://localhost:5000/MoviesTitle/AllMovies?search=${encodeURIComponent(recommendation.title)}`
      );
      if (response.ok) {
        const data = await response.json();
        const movieDetails = data.movies?.[0];
        if (movieDetails) {
          handleMovieClick(movieDetails);
        }
      }
    } catch (error) {
      console.error('Error fetching movie details:', error);
    }
  };

  useEffect(() => {
    if (query) {
      fetchMovies();
      fetchRecommendations();
      fetchGenreRecommendations();
    } else {
      setMovies([]);
      setRecommendations([]);
      setGenreRecommendations([]);
      setLoading(false);
    }
  }, [query]);

  return (
    <div className="recommendations-page">
      <h1 className="recommendations-title">Search Results for "{query}"</h1>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : movies.length === 0 ? (
        <div className="no-results">No movies found matching your search.</div>
      ) : (
        <>
          <div className="search-results-grid">
            {movies.map((movie) => (
              <div key={movie.showId} className="movie-card-container">
                <div
                  className="movie-card"
                  onClick={() => handleCardClick(movie)}
                >
                  <div className="card-front">
                    <img
                      src={movie.movie_poster || comingSoon}
                      alt={movie.title}
                      className="movie-poster"
                      onError={(e) => {
                        e.currentTarget.src = comingSoon;
                      }}
                    />
                    <div className="movie-title-overlay">{movie.title}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {recommendations.length > 0 && (
            <div className="recommendations-section">
              <h2 className="recommendations-title">You Might Also Like</h2>
              <div className="carousel-container">
                <div className="carousel-wrapper">
                  <Slider {...carouselSettings}>
                    {recommendations.map((rec) => (
                      <div key={rec.title} className="carousel-item">
                        <div
                          className="movie-card"
                          onClick={() => handleRecCardClick(rec)}
                        >
                          <div className="card-front">
                            <img
                              src={rec.movie_poster || comingSoon}
                              alt={rec.title}
                              className="movie-poster"
                              onError={(e) => {
                                e.currentTarget.src = comingSoon;
                              }}
                            />
                            <div className="movie-title-overlay">
                              {rec.title}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </Slider>
                </div>
              </div>
            </div>
          )}

          {genreRecommendations.length > 0 && !loadingGenreRecs && (
            <div className="recommendations-section genre-recommendations">
              <h2 className="recommendations-title">Similar by Genre</h2>
              <div className="carousel-container">
                <div className="carousel-wrapper">
                  <Slider {...carouselSettings}>
                    {genreRecommendations.map((rec) => (
                      <div key={`${rec.title}-genre`} className="carousel-item">
                        <div
                          className="movie-card genre-card"
                          onClick={() => handleRecCardClick(rec)}
                        >
                          <div className="card-front">
                            <img
                              src={rec.movie_poster || comingSoon}
                              alt={rec.title}
                              className="movie-poster"
                              onError={(e) => {
                                e.currentTarget.src = comingSoon;
                              }}
                            />
                            {rec.genres && rec.genres.length > 0 && (
                              <div className="genres-container">
                                {rec.genres.map((genre, index) => (
                                  <span key={index} className="genre-tag">
                                    {genre}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="movie-title-overlay">
                              {rec.title}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </Slider>
                </div>
              </div>
            </div>
          )}

          {selectedMovie && (
            <div className="movie-modal">
              <div className="movie-modal-content">
                <div className="movie-modal-header">
                  <h2 className="movie-modal-title">{selectedMovie.title}</h2>
                  <button className="close-button" onClick={handleCloseModal}>
                    ×
                  </button>
                </div>
                <div className="movie-modal-body">
                  <img
                    src={selectedMovie.movie_poster || comingSoon}
                    alt={selectedMovie.title}
                    className="movie-modal-poster"
                    onError={(e) => {
                      e.currentTarget.src = comingSoon;
                    }}
                  />
                  <div className="movie-modal-info">
                    <p>
                      <strong>Year:</strong> {selectedMovie.releaseYear}
                    </p>
                    <p>
                      <strong>Rating:</strong> {selectedMovie.rating}
                    </p>
                    <p>
                      <strong>Duration:</strong> {selectedMovie.duration}
                    </p>
                    <p>
                      <strong>Director:</strong> {selectedMovie.director}
                    </p>
                    <p>
                      <strong>Cast:</strong> {selectedMovie.cast}
                    </p>
                    <p>
                      <strong>Country:</strong> {selectedMovie.country}
                    </p>
                    <p className="description">
                      <strong>Description:</strong> {selectedMovie.description}
                    </p>

                    <div className="rating-section">
                      <h3 className="rating-title">
                        {userRating > 0 ? 'Your Rating' : 'Rate this movie'}
                      </h3>
                      <div className="rating-stars">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`star ${star <= (hoverRating || userRating) ? 'active' : ''}`}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setUserRating(star)}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <div className="rating-input">
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={userRating}
                          onChange={(e) =>
                            setUserRating(Number(e.target.value))
                          }
                        />
                        <button
                          className="submit-rating"
                          onClick={handleRatingSubmit}
                          disabled={!userRating || !getUserId()}
                        >
                          {userRating > 0 ? 'Update Rating' : 'Submit Rating'}
                        </button>
                        {!getUserId() && (
                          <div className="login-prompt">
                            Please log in to rate movies
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="recommendations-section">
                  <h3>Recommended for you</h3>
                  {loadingModalRecs ? (
                    <div className="loading">Loading recommendations...</div>
                  ) : modalRecommendations.length > 0 ? (
                    <div className="recommendations-carousel">
                      {modalRecommendations.map((recommendation) => (
                        <div
                          key={recommendation.show_id || recommendation.title}
                          className="recommendation-item"
                          onClick={() =>
                            handleRecommendationClick(recommendation)
                          }
                        >
                          <img
                            src={recommendation.movie_poster || comingSoon}
                            alt={recommendation.title}
                            className="recommendation-poster"
                            onError={(e) => {
                              e.currentTarget.src = comingSoon;
                            }}
                          />
                          <div className="recommendation-title">
                            {recommendation.title}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-recommendations">
                      No recommendations available
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
