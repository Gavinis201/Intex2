import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../App.css';
import { isAuthenticated, getCurrentUser, logout } from '../services/authService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';


function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [authenticated, setAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState('');
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/moviepage?title=${encodeURIComponent(searchInput.trim())}`);
    }
  };
  // Debug: check current path
  console.log("Current path:", location.pathname);

  // Normalize path to lowercase just in case
  const showSearchBar = location.pathname.toLowerCase() === '/moviepage';

  useEffect(() => {
    setAuthenticated(isAuthenticated());
    setUserEmail(getCurrentUser() || '');
  }, []);

  const handleLogout = () => {
    logout();
    setAuthenticated(false);
    setUserEmail('');
    navigate('/login');
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
      <Link to="/" className="d-flex align-items-center text-decoration-none">
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
      <div className="d-flex flex-row custom-gap">
        
      {/* Search bar only on /moviepage */}
      {showSearchBar && (
    <form onSubmit={handleSearch}>
      <FontAwesomeIcon icon={faSearch} style={{ color: 'white', fontSize: '1.2rem', marginRight: '10px' }} />
      <input
        type="text"
        className="movieSearch"
        placeholder="Movie Titles..."
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
      />
    </form>
)}


      {/* Auth button */}
      <div className="d-flex align-items-center gap-3">
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
          onClick={handleLogout}
        >
          Sign out
        </button>
      </div>
</div>
    </header>
  );
}

export default Header;
