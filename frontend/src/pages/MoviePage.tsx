import interstellar from '../assets/images/InterstellarMax.avif';
import './MoviePage.css';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay } from '@fortawesome/free-solid-svg-icons';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons/faCircleInfo';
import Slider from "react-slick";
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import comingSoon from '../assets/images/ComingSoon.png';

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
  'Thrillers'
];

function MoviePage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("query") || "";
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

  const carouselSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 5,
    slidesToScroll: 2,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 2,
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

  const fetchMoviesByGenre = async (genre: string) => {
    try {
      const response = await fetch(`https://localhost:5000/MoviesTitle/AllMovies?pageSize=10&pageNum=1&genres=${encodeURIComponent(genre)}`);
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
      const response = await fetch(`https://localhost:5000/MoviesTitle/AllMovies?pageSize=20&pageNum=${pageNum}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      const newMovies = data.movies || [];
      
      if (pageNum === 1) {
        setAllMovies(newMovies);
      } else {
        setAllMovies(prev => [...prev, ...newMovies]);
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
    setPage(1);
  }, [selectedGenre]);

  const handleScroll = useCallback(() => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
      document.documentElement.scrollHeight - 500 &&
      !loadingMore &&
      hasMore
    ) {
      setPage(prev => prev + 1);
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

  const handleMovieClick = (movie: Movie) => {
    setSelectedMovie(movie);
    setUserRating(0);
    setHoverRating(0);
  };

  const handleCloseModal = () => {
    setSelectedMovie(null);
  };

  const handleRatingSubmit = async () => {
    if (!selectedMovie) return;

    try {
      const response = await fetch('https://localhost:5000/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          showId: selectedMovie.showId,
          rating: userRating,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit rating');
      }

      fetchMoviesByGenre(selectedGenre);
      handleCloseModal();
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  };

  return (
    <div className="movie-page">
      <div className="image-container">
        <img src={interstellar} alt="Interstellar" className="interstelllar" />
        <div className="button-row">
          <button className="play-button">
            <FontAwesomeIcon icon={faPlay} className="icon" /> Play
          </button>
          <button className="info-button">
            <FontAwesomeIcon icon={faCircleInfo} className="icon" />
            <b> More Info</b>
          </button>
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
                      src={movie.movie_poster || 'https://via.placeholder.com/200x300?text=No+Poster'} 
                      alt={movie.title}
                      className="movie-poster"
                    />
                  </div>
                </div>
              ))}
            </Slider>
          </div>

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
                    src={movie.movie_poster || 'https://via.placeholder.com/200x300?text=No+Poster'} 
                    alt={movie.title}
                    className="movie-poster"
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
              <button className="close-button" onClick={handleCloseModal}>×</button>
            </div>
            <div className="movie-modal-body">
              <img 
                src={selectedMovie.movie_poster || 'https://via.placeholder.com/300x450?text=No+Poster'} 
                alt={selectedMovie.title}
                className="movie-modal-poster"
              />
              <div className="movie-modal-info">
                <p><strong>Year:</strong> {selectedMovie.releaseYear}</p>
                <p><strong>Rating:</strong> {selectedMovie.rating}</p>
                <p><strong>Duration:</strong> {selectedMovie.duration}</p>
                <p><strong>Director:</strong> {selectedMovie.director}</p>
                <p><strong>Cast:</strong> {selectedMovie.cast}</p>
                <p><strong>Country:</strong> {selectedMovie.country}</p>
                <p className="description"><strong>Description:</strong> {selectedMovie.description}</p>
                
                <div className="rating-section">
                  <h3 className="rating-title">Rate this movie</h3>
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
                      disabled={!userRating}
                    >
                      Submit Rating
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MoviePage;
