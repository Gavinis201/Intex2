import './MoviePage.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay } from '@fortawesome/free-solid-svg-icons';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons/faCircleInfo';
import Slider from 'react-slick';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import comingSoon from '../assets/images/ComingSoon.png';
import mainPage from '../assets/images/Jaws1.avif';
import Cookies from 'js-cookie';
import { getRecommendations } from '../api/RecommendationAPI';

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
  userRating?: number;
};

type Recommendation = {
  show_id: string;
  title: string;
  description: string;
  movie_poster?: string;
};

const genres = [
  'Action',
  'Adventure',
  'AnimeSeriesInternationalTvShows',
  'BritishTvShowsDocuseriesInternationalTvShows',
  'Children',
  'Comedies',
  'ComediesDramasInternationalMovies',
  'ComediesInternationalMovies',
  'ComediesRomanticMovies',
  'CrimeTvShowsDocuseries',
  'Documentaries',
  'DocumentariesInternationalMovies',
  'Docuseries',
  'Dramas',
  'DramasInternationalMovies',
  'DramasRomanticMovies',
  'FamilyMovies',
  'Fantasy',
  'HorrorMovies',
  'InternationalMoviesThrillers',
  'InternationalTvShowsRomanticTvShowsTvDramas',
  'KidsTv',
  'LanguageTvShows',
  'Musicals',
  'NatureTv',
  'RealityTv',
  'Spirituality',
  'TvAction',
  'TvComedies',
  'TvDramas',
  'TalkShowsTvComedies',
  'Thrillers',
];

function MoviePage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('query') || '';
  const [movies, setMovies] = useState<Movie[]>([]);
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedGenre, setSelectedGenre] = useState<string>('Action');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [userRatedMovies, setUserRatedMovies] = useState<Movie[]>([]);
  const [loadingUserRatings, setLoadingUserRatings] = useState(false);

  const getUserId = () => {
    const userId = Cookies.get('moviesUserId');
    console.log('Current moviesUserId cookie:', userId);
    return userId || '';
  };

  const carouselSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 6,
    slidesToScroll: 2,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    responsive: [
      {
        breakpoint: 1400,
        settings: {
          slidesToShow: 5,
          slidesToScroll: 2,
        },
      },
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 2,
        },
      },
      {
        breakpoint: 900,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
    ],
  };

  // New settings for rated movies carousel with autoplay disabled
  const ratedMoviesCarouselSettings = {
    ...carouselSettings,
    autoplay: false,
  };

  const fetchMoviesByGenre = async (genre: string) => {
    try {
      const response = await fetch(
        `https://localhost:5000/MoviesTitle/AllMovies?pageSize=10&pageNum=1&genres=${encodeURIComponent(genre)}`
      );
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setMovies(data.movies || []);
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllMovies = async (pageNum: number) => {
    try {
      setLoadingMore(true);
      const response = await fetch(
        `https://localhost:5000/MoviesTitle/AllMovies?pageSize=20&pageNum=${pageNum}`
      );
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      const newMovies = data.movies || [];

      if (pageNum === 1) {
        setAllMovies(newMovies);
      } else {
        setAllMovies((prev) => [...prev, ...newMovies]);
      }

      setHasMore(newMovies.length > 0);
    } catch (error) {
      console.error('Error fetching all movies:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchMoviesByGenre(selectedGenre);
    fetchAllMovies(1);
    fetchUserRatedMovies();
    setPage(1);
  }, [selectedGenre]);

  const fetchUserRatedMovies = async () => {
    const userId = getUserId();
    if (!userId) return;

    setLoadingUserRatings(true);
    try {
      console.log(`Fetching ratings for user ID: ${userId}`);

      // Fetch the user's ratings from the ratings API
      const response = await fetch(
        `https://localhost:5000/api/ratings/user/${userId}`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch user ratings: ${response.status}`);
      }

      const ratings = await response.json();
      console.log('User ratings:', ratings);
      console.log(
        'Rating object structure:',
        ratings.length > 0 ? JSON.stringify(ratings[0], null, 2) : 'No ratings'
      );

      if (!ratings || ratings.length === 0) {
        console.log('No ratings found for user');
        setUserRatedMovies([]);
        setLoadingUserRatings(false);
        return;
      }

      // Get the full movie details for each rated movie using their show_id
      const ratedMoviesDetails = await Promise.all(
        ratings.map(async (rating: any) => {
          try {
            // Fetch the specific movie details using the show_id and the correct endpoint
            console.log(
              `Fetching details for movie with show_id: ${rating.showId}`
            );
            const movieResponse = await fetch(
              `https://localhost:5000/MoviesTitle/${rating.showId}`
            );

            if (!movieResponse.ok) {
              console.error(
                `Failed to fetch movie details for show_id: ${rating.showId}`
              );
              return null;
            }

            const movieData = await movieResponse.json();
            console.log(`Movie data for ${rating.showId}:`, movieData);

            // Combine the movie data with the user's rating
            return {
              ...movieData,
              userRating: rating.rating,
            };
          } catch (error) {
            console.error(
              `Error fetching movie details for show_id: ${rating.showId}`,
              error
            );
            return null;
          }
        })
      );

      // Filter out any null results (failed fetches)
      const validMovies = ratedMoviesDetails.filter((movie) => movie !== null);
      console.log('Valid rated movies:', validMovies);

      setUserRatedMovies(validMovies);
    } catch (error) {
      console.error('Error fetching user rated movies:', error);
      setUserRatedMovies([]);
    } finally {
      setLoadingUserRatings(false);
    }
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

  // Add an error handler for images
  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    e.currentTarget.src;
  };

  const handleScroll = useCallback(() => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.scrollHeight - 500 &&
      !loadingMore &&
      hasMore
    ) {
      setPage((prev) => prev + 1);
    }
  }, [loadingMore, hasMore]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (page > 1) {
      fetchAllMovies(page);
    }
  }, [page]);

  const handleGenreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGenre(e.target.value);
    setLoading(true);
  };

  const handleMovieClick = async (movie: Movie) => {
    setSelectedMovie(movie);
    setHoverRating(0);
    fetchRecommendations(movie.showId);
    logMovieClick(movie.showId);

    // Fetch user's rating for this movie
    const rating = await fetchUserRatingForMovie(movie.showId);
    setUserRating(rating);
  };

  const handleRecommendationClick = async (recommendation: Recommendation) => {
    try {
      // Find the movie in allMovies first
      const movie = allMovies.find((m) => m.showId === recommendation.show_id);
      if (movie) {
        handleMovieClick(movie);
        return;
      }

      // If not found in allMovies, fetch the movie details
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

  const handleCloseModal = () => {
    setSelectedMovie(null);
    setRecommendations([]);
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

      // Refresh the user's rated movies list
      fetchUserRatedMovies();

      // Optional: show a success message
      alert('Rating submitted successfully!');
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Failed to submit rating. Please try again.');
    }
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
        const data = await response.json();
        console.log('Response from backend:', data);
      } else if (response.status === 404) {
        // Handle the case where the endpoint doesn't exist yet
        console.warn(
          `Movie click endpoint not found (404). Make sure the backend controller is implemented.`
        );
      } else {
        console.error(
          `Failed to log movie click: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      // Handle network errors (e.g., backend not running)
      console.error('Error logging movie click:', error);
    }
  };

  const fetchRecommendations = async (showId: string) => {
    setLoadingRecommendations(true);
    try {
      console.log(`Fetching recommendations for movie ID: ${showId}`);
      const userId = getUserId();
      console.log(`User ID for recommendations: ${userId || 'none'}`);

      // Get recommendations from API service
      const data = await getRecommendations({
        show_id: showId,
        user_id: userId ? parseInt(userId) : null,
        top_n: 5,
      });

      // Map through the recommendations and try to find matching posters in allMovies
      const enhancedRecommendations = await Promise.all(
        data.map(async (rec: Recommendation) => {
          try {
            // First try to find the movie in allMovies
            const matchingMovie = allMovies.find(
              (m) => m.showId === rec.show_id
            );
            if (matchingMovie?.movie_poster) {
              return {
                ...rec,
                movie_poster: matchingMovie.movie_poster,
              };
            }

            // If not found, try to fetch the movie details
            const movieResponse = await fetch(
              `https://localhost:5000/MoviesTitle/AllMovies?search=${encodeURIComponent(rec.title)}`
            );
            if (movieResponse.ok) {
              const movieData = await movieResponse.json();
              const movie = movieData.movies?.[0];
              return {
                ...rec,
                movie_poster: movie?.movie_poster || comingSoon,
              };
            }
            return {
              ...rec,
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

      setRecommendations(enhancedRecommendations);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setRecommendations([]);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Add useEffect to scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="movie-page">
      <div className="hero-container">
        <div className="hero-background">
          <img src={mainPage} alt="Jaws" className="hero-image" />
          <div className="hero-overlay"></div>
        </div>
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">Jaws</h1>
            <p className="hero-description">
              When a great white shark terrorizes a small beach town, the local
              police chief, a marine biologist, and a grizzled fisherman set out
              to stop it.
            </p>
            <div className="hero-buttons">
              <button className="play-button">
                <FontAwesomeIcon icon={faPlay} className="icon" /> Play
              </button>
              <button className="info-button">
                <FontAwesomeIcon icon={faCircleInfo} className="icon" />
                <b> More Info</b>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="genre-section">
        <h2>Browse by Genre</h2>
        <select
          className="genre-select"
          value={selectedGenre}
          onChange={handleGenreChange}
        >
          {genres.map((genre) => (
            <option key={genre} value={genre}>
              {genre.replace(/([A-Z])/g, ' $1').trim()}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading movies...</div>
      ) : (
        <>
          <div className="carousel-section">
            <h2>{selectedGenre.replace(/([A-Z])/g, ' $1').trim()}</h2>
            <Slider {...carouselSettings}>
              {movies.map((movie) => (
                <div key={movie.showId} className="carousel-item">
                  <div
                    className="movie-card"
                    onClick={() => handleMovieClick(movie)}
                  >
                    <img
                      src={movie.movie_poster || comingSoon}
                      alt={movie.title}
                      className="movie-poster"
                      onError={(e) => {
                        e.currentTarget.src = comingSoon;
                      }}
                    />
                  </div>
                </div>
              ))}
            </Slider>
          </div>

          {/* User Rated Movies Section */}
          {getUserId() && (
            <div className="rated-movies-section">
              <h2>Your Rated Movies</h2>
              {loadingUserRatings ? (
                <div className="loading">Loading your rated movies...</div>
              ) : userRatedMovies.length > 0 ? (
                <div className="rated-movies-carousel">
                  <Slider {...ratedMoviesCarouselSettings}>
                    {userRatedMovies.map((movie) => (
                      <div key={movie.showId} className="carousel-item">
                        <div
                          className="movie-card rated-movie-card"
                          onClick={() => handleMovieClick(movie)}
                        >
                          <img
                            src={movie.movie_poster || comingSoon}
                            alt={movie.title}
                            className="movie-poster"
                            onError={(e) => {
                              e.currentTarget.src = comingSoon;
                            }}
                          />
                          <div className="user-rating-badge">
                            {movie.userRating} ★
                          </div>
                        </div>
                      </div>
                    ))}
                  </Slider>
                </div>
              ) : (
                <div className="no-rated-movies">
                  <p>
                    You haven't rated any movies yet. Rate movies to see them
                    appear here!
                  </p>
                  <button
                    className="explore-button"
                    onClick={() =>
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }
                  >
                    Explore Movies to Rate
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="all-movies-section">
            <h2>All Movies</h2>
            <div className="movies-grid">
              {allMovies.map((movie) => (
                <div
                  key={movie.showId}
                  className="movie-card"
                  onClick={() => handleMovieClick(movie)}
                >
                  <img
                    src={movie.movie_poster || comingSoon}
                    alt={movie.title}
                    className="movie-poster"
                    onError={(e) => {
                      e.currentTarget.src = comingSoon;
                    }}
                  />
                </div>
              ))}
            </div>
            {loadingMore && (
              <div className="loading-more">Loading more movies...</div>
            )}
          </div>
        </>
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
                      onChange={(e) => setUserRating(Number(e.target.value))}
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
              {loadingRecommendations ? (
                <div className="loading">Loading recommendations...</div>
              ) : recommendations.length > 0 ? (
                <div className="recommendations-carousel">
                  {recommendations.map((recommendation) => (
                    <div
                      key={recommendation.show_id}
                      className="recommendation-item"
                      onClick={() => handleRecommendationClick(recommendation)}
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
    </div>
  );
}

export default MoviePage;
