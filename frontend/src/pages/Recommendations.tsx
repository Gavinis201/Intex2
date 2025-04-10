import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './Recommendations.css';
import comingSoon from '../assets/images/ComingSoon.png';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

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

export default function RecommendationsPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('query') || '';
  const [movies, setMovies] = useState<Movie[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [error, setError] = useState('');
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const [flippedRecCards, setFlippedRecCards] = useState<Set<string>>(new Set());

  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    centerMode: false,
    centerPadding: "0px",
    responsive: [
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 900,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1
        }
      }
    ]
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
      const response = await fetch('https://localhost:5000/api/recommender/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: query,
          top_n: 10,
        }),
      });

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
              movie_poster: movie?.movie_poster || comingSoon
            };
          } catch (err) {
            return {
              ...rec,
              movie_poster: comingSoon
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

  const toggleRecCard = (title: string) => {
    setFlippedRecCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(title)) {
        newSet.delete(title);
      } else {
        newSet.add(title);
      }
      return newSet;
    });
  };

  useEffect(() => {
    if (query) {
      fetchMovies();
      fetchRecommendations();
    } else {
      setMovies([]);
      setRecommendations([]);
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
                              <p><strong>Similarity Score:</strong> {rec.similarity.toFixed(3)}</p>
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
        </>
      )}
    </div>
  );
}