import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../App.css';
import { isAuthenticated, getCurrentUser, logout, isAdmin } from '../services/authService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';


function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [authenticated, setAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState('');
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/recommendation?query=${encodeURIComponent(searchInput.trim())}`);
    }
  };
  // Debug: check current path
  console.log("Current path:", location.pathname);

  // Show search bar on MoviePage, SearchPage, and Recommendations page
  const showSearchBar = location.pathname.toLowerCase() === '/moviepage' || 
                       location.pathname.toLowerCase() === '/search' ||
                       location.pathname.toLowerCase() === '/recommendation';

  useEffect(() => {
    // Re-check authentication status when component mounts or re-renders
    const checkAuth = () => {
      setAuthenticated(isAuthenticated());
      setUserEmail(getCurrentUser() || '');
      setUserIsAdmin(isAdmin());
    };
    
    checkAuth();
    
    // Also set up interval to periodically check auth status
    const intervalId = setInterval(checkAuth, 3000);
    
    return () => clearInterval(intervalId);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setAuthenticated(false);
    setUserEmail('');
    setUserIsAdmin(false);
    navigate('/');
  };

  return (
    <header 
      className="d-flex justify-content-between align-items-center px-4 py-3 bg-black border-bottom border-white"
      style={{
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}
    >
      {/* Logo */}
      <div className="d-flex align-items-center gap-4">
        <Link to={authenticated ? '/MoviePage' : '/'} className="d-flex align-items-center text-decoration-none">
          <h1 
            className="mb-0 fs-1 fw-bold"
            style={{
              color: '#8A2BE2',
              fontFamily: 'Poppins, sans-serif',
              letterSpacing: '-0.5px'
            }}
          >
            CineNiche
          </h1>
        </Link>
        
        {authenticated && (
          <button
            className="btn text-white"
            style={{
              border: 'none',
              fontFamily: 'Montserrat, sans-serif',
              transition: 'all 0.2s ease',
              padding: '0.5rem 1rem',
              background: 'none',
            }}
            onMouseOver={(e) => e.currentTarget.style.color = '#9D3BE3'}
            onMouseOut={(e) => e.currentTarget.style.color = 'white'}
            onClick={() => navigate('/MoviePage')}
          >
            Movies
          </button>
        )}
        
        {/* Admin button - only visible to admin users */}
        {authenticated && userIsAdmin && (
          <button
            className="btn text-white"
            style={{
              border: 'none',
              fontFamily: 'Montserrat, sans-serif',
              transition: 'all 0.2s ease',
              padding: '0.5rem 1rem',
              background: 'none',
            }}
            onMouseOver={(e) => e.currentTarget.style.color = '#9D3BE3'}
            onMouseOut={(e) => e.currentTarget.style.color = 'white'}
            onClick={() => navigate('/AdminMovies')}
          >
            Admin Dashboard
          </button>
        )}
      </div>
      <div className="d-flex flex-row custom-gap align-items-center">
        
      {/* Search bar on MoviePage and SearchPage */}
      {showSearchBar && (
        <form onSubmit={handleSearch} className="d-flex align-items-center me-3">
          <FontAwesomeIcon icon={faSearch} style={{ color: 'white', fontSize: '1.2rem', marginRight: '10px' }} />
          <input
            type="text"
            className="movieSearch"
            placeholder="Search movies..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>
      )}

      {/* Auth button */}
      <div className="d-flex align-items-center gap-3">
        {authenticated && (
          <span className="text-white me-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Hello, {userEmail.split('@')[0]}
          </span>
        )}
        
        {/* Settings button - moved to right side */}
        {authenticated && (
          <button
            className="btn text-white me-2"
            style={{
              border: 'none',
              fontFamily: 'Montserrat, sans-serif',
              transition: 'all 0.2s ease',
              background: 'none',
            }}
            onMouseOver={(e) => e.currentTarget.style.color = '#9D3BE3'}
            onMouseOut={(e) => e.currentTarget.style.color = 'white'}
            onClick={() => navigate('/Settings')}
          >
            Settings
          </button>
        )}
        
        <button
          className="btn btn-primary btn-md"
          style={{
            backgroundColor: '#8A2BE2',
            border: 'none',
            fontFamily: 'Montserrat, sans-serif',
            transition: 'all 0.2s ease',
            padding: '0.5rem 1.25rem',
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#9D3BE3'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#8A2BE2'}
          onClick={authenticated ? handleLogout : () => navigate('/login')}
        >
          {authenticated ? 'Sign Out' : 'Sign In'}
        </button>
      </div>
</div>
    </header>
  );
}

export default Header;
