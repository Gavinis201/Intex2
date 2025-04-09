import '../Matt.css';
import { Link } from 'react-router-dom';
import backStreetGirls from '../assets/images/Top10/Back Street Girls GOKUDOLS.jpg'
import legallyBlonde from '../assets/images/Top10/Legally Blonde.jpg';
import inconceivable from '../assets/images/Top10/Inconceivable.jpg';
import heNeverDied from '../assets/images/Top10/He Never Died.jpg';
import ghostRider from '../assets/images/Top10/Ghost Rider.jpg';
import frenchToast from '../assets/images/Top10/French Toast.jpg';
import fallen from '../assets/images/Top10/Fallen.jpg';
import daybreak from '../assets/images/Top10/Daybreak.jpg';
import blackway from '../assets/images/Top10/Blackway.jpg';
import badBlood from '../assets/images/Top10/Bad Blood.jpg';

const HomeComp = () => {
  const topMovies = [
    { img: backStreetGirls, title: 'Back Street Girls GOKUDOLS' },
    { img: legallyBlonde, title: 'Legally Blonde' },
    { img: inconceivable, title: 'Inconceivable' },
    { img: heNeverDied, title: 'He Never Died' },
    { img: ghostRider, title: 'Ghost Rider' },
    { img: frenchToast, title: 'French Toast' },
    { img: fallen, title: 'Fallen' },
    { img: daybreak, title: 'Daybreak' },
    { img: blackway, title: 'Blackway' },
    { img: badBlood, title: 'Bad Blood' }
  ];

  return (
    <>
    <div className="backgroundPicHomePage">
      <div className="homeContent">
        <br /><br />
        <h1>Thousands of movies,<br />Best Ratings, and more</h1>
        <h4>Ready to start?</h4>
        <Link to="/CreateAccount">
          <button className="create-account-btn">Create an Account</button>
        </Link>
      </div>
      <div className="homeContent trending-section">
        <h3>Top 10 Movies</h3>
        <div className="movie-grid">
          {topMovies.map((movie, index) => (
            <div key={movie.title} className="movie-thumbnail">
              <div className="rank-number">{index + 1}</div>
              <img 
                src={movie.img}
                alt={movie.title}
                className="trending-thumbnail"
              />
              <p className="movie-title">{movie.title}</p>
            </div>
          ))}
        </div>
      </div>
      <footer>
        <p style={{ color: 'white', textAlign: 'center', margin: '0' }}>© 2024 Movie Rating Site. All rights reserved.</p>
      </footer>
    </div>

    </>
  );
};

export default HomeComp;