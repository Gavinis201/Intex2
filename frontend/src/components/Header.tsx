import { Link } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import '../App.css';



function Header() {
  return (
    <>
      <header className="d-flex justify-content-between align-items-center px-4 py-3 bg-dark">
        {/* Logo */}
        <Link
          to="/"
          className="fs-1 fw-bold text-decoration-none"
          style={{
            color: 'var(--primary-purple)',
            fontFamily: 'Poppins, sans-serif'
          }}
        >
          CineNiche
        </Link>

        {/* Avatar + Sign out */}
        <div className="d-flex align-items-center gap-3">
          <button
            className="btn btn-primary btn-md"
            style={{
              backgroundColor: 'var(--primary-purple)',
              border: 'none',
              fontFamily: 'Montserrat, sans-serif'
            }}
          >
            Sign out
          </button>
        </div>
      </header>
      {/* <hr style={{ color: 'white' }} /> */}
    </>
  );
}

export default Header;
