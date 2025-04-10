import HomeComp from '../components/HomeComp';
import '../Matt.css';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../services/authService';

function HomePage() {
  const navigate = useNavigate();
  
  // Redirect authenticated users to the movies page
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/MoviePage');
    }
  }, [navigate]);

  // Only render HomeComp for non-authenticated users
  return !isAuthenticated() ? <HomeComp /> : null;
}

export default HomePage;