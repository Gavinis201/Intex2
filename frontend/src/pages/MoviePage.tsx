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



type EnrichedRecommendation = {
  title: string;
  similarity: number;
  showId?: string;
  releaseYear?: number;
  description?: string;
  rating?: string;
  type?: string;
};

function MoviePage() {
  const [recommendations, setRecommendations] = useState<EnrichedRecommendation[]>([]);
  const [searchParams] = useSearchParams();
  const title = searchParams.get("title") || "Interstellar";

  useEffect(() => {
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

    fetchRecommendations();
  }, [title]);

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
  };

  return (
    <>
      <div className="image-container">
        <img src={interstellar} alt="Interstellar" className="interstelllar" />

        <div className="button-row">
          <button className="play-button">
            <FontAwesomeIcon icon={faPlay} className="icon" />
            <b> Play</b>
          </button>

          <button className="info-button">
            <FontAwesomeIcon icon={faCircleInfo} className="icon" />
            <b> More Info</b>
          </button>
        </div>
      </div>

      <section className="carousel-section">
        <h2>Top 5 Recommended Movies for "{title}"</h2>
        <Slider {...settings}>
          {recommendations.map((movie, index) => (
            <div key={index} className="carousel-item">
              <div className="movie-card">
                <h3>{movie.title}</h3>
                <p>{movie.releaseYear} • {movie.rating}</p>
                <p className="description">{movie.description}</p>
              </div>
            </div>
          ))}
        </Slider>
      </section>
    </>
  );
}

export default MoviePage;
