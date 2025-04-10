import interstellar from '../assets/images/InterstellarMax.avif';
import './MoviePage.css';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay } from '@fortawesome/free-solid-svg-icons';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons/faCircleInfo';
import Slider from "react-slick";
import { useEffect, useState } from 'react';
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

type GenreMovies = {
  [key: string]: Movie[];
};

function MoviePage() {
  const [searchParams] = useSearchParams();
  const title = searchParams.get("title") || "Interstellar";
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [genreMovies, setGenreMovies] = useState<GenreMovies>({});
  const [loading, setLoading] = useState(true);
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());

  const genres = [
    'Action',
    'Comedies',
    'Documentaries',
    'Dramas',
    'Fantasy'
  ];

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

  const fetchRecommendations = async () => {
    try {
      const response = await axios.post('/api/recommender/recommend', {
        title: title,
        topN: 5,
      });

      if (Array.isArray(response.data)) {
        setRecommendations(response.data);
      }
    } catch (err) {
      console.error("Error fetching recommendations", err);
    }
  };

  const fetchMoviesByGenre = async (genre: string) => {
    try {
      const response = await axios.get(
        `https://localhost:5000/MoviesTitle/AllMovies?pageSize=10&pageNum=1&genres=${encodeURIComponent(genre)}`
      );
      
      if (response.data.movies) {
        // Sort movies by rating (assuming rating is a string like "PG-13")
        const sortedMovies = response.data.movies.sort((a: Movie, b: Movie) => {
          return b.rating.localeCompare(a.rating);
        });
        
        setGenreMovies(prev => ({
          ...prev,
          [genre]: sortedMovies
        }));
      }
    } catch (err) {
      console.error(`Error fetching ${genre} movies:`, err);
    }
  };

  useEffect(() => {
    fetchRecommendations();
    genres.forEach(genre => fetchMoviesByGenre(genre));
    setLoading(false);
  }, [title]);

  const toggleCard = (showId: string) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(showId)) {
        newSet.delete(showId);
      } else {
        newSet.add(showId);
      }
      return newSet;
    });
  };

  const formatGenreName = (genre: string) => {
    return genre;
  };

  return (
    <>
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

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          {recommendations.length > 0 && (
            <section className="carousel-section">
              <h2>Recommended Movies</h2>
              <Slider {...carouselSettings}>
                {recommendations.map((movie) => (
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
                          <p><strong>Year:</strong> {movie.releaseYear}</p>
                          <p><strong>Rating:</strong> {movie.rating}</p>
                          <p><strong>Duration:</strong> {movie.duration}</p>
                          <p><strong>Director:</strong> {movie.director}</p>
                          <p><strong>Description:</strong> {movie.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </Slider>
            </section>
          )}

          {genres.map(genre => (
            <section key={genre} className="carousel-section">
              <h2>{formatGenreName(genre)}</h2>
              <Slider {...carouselSettings}>
                {genreMovies[genre]?.map((movie) => (
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
                          <p><strong>Year:</strong> {movie.releaseYear}</p>
                          <p><strong>Rating:</strong> {movie.rating}</p>
                          <p><strong>Duration:</strong> {movie.duration}</p>
                          <p><strong>Director:</strong> {movie.director}</p>
                          <p><strong>Description:</strong> {movie.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </Slider>
            </section>
          ))}
        </>
      )}
    </>
  );
}

export default MoviePage;
