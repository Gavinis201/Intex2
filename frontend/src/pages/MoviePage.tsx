import interstellar from '../assets/images/InterstellarMax.avif'
import './MoviePage.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay } from '@fortawesome/free-solid-svg-icons';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons/faCircleInfo';

function MoviePage() {
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
<img src="{}" alt="" />
    </>
  );
}

export default MoviePage;
