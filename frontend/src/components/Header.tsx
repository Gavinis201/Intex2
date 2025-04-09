import { Link } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import '../App.css';

function Header() {
  return (
    <>
      <header 
        className="d-flex justify-content-between align-items-center px-4 py-4 bg-black border-bottom border-white"
        style={{
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          position: 'sticky',
          top: 0,
          zIndex: 1000
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          className="d-flex align-items-center text-decoration-none"
        >
          <h1 
            className="mb-0 fs-2 fw-bold"
            style={{
              color: '#8A2BE2', // Bright purple color
              fontFamily: 'Poppins, sans-serif',
              letterSpacing: '-0.5px'
            }}
          >
            CineNiche
          </h1>
        </Link>

        {/* Avatar + Sign out */}
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
          >
            Sign In
          </button>
        </div>
      </header>
    </>
  );
}

export default Header;
