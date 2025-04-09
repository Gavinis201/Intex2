import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXTwitter,
  faInstagram,
  faYoutube,
  faLinkedin,
} from "@fortawesome/free-brands-svg-icons";
import { Link } from "react-router-dom";
import "../App.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <>
    
    <footer className="bg-black text-white py-3 border-top">
      <div className="container">
        <div className="row g-2">
          {/* Left - Logo + Icons */}
          <div className="col-md-4">
            <div className="d-flex flex-column align-items-start gap-2">
              <h3 className="textpurple mb-0">CN</h3>
              <p className="text-light small mb-2">Connecting ideas, inspiring innovation.</p>
              <div className="d-flex gap-3">
                <a href="https://x.com" target="_blank" rel="noreferrer" className="text-white hover-purple">
                  <FontAwesomeIcon icon={faXTwitter} />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-white hover-purple">
                  <FontAwesomeIcon icon={faInstagram} />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noreferrer" className="text-white hover-purple">
                  <FontAwesomeIcon icon={faYoutube} />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="text-white hover-purple">
                  <FontAwesomeIcon icon={faLinkedin} />
                </a>
              </div>
            </div>
          </div>

          {/* Middle - Quick Links */}
          <div className="col-md-4">
            <h6 className="fw-bold mb-2">Quick Links</h6>
            <ul className="list-unstyled small mb-0">
              <li>
                <Link to="/FAQ" className="text-white text-decoration-none hover-purple">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/Privacy" className="text-white text-decoration-none hover-purple">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/Contact" className="text-white text-decoration-none hover-purple">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Right - Contact Info */}
          <div className="col-md-4">
            <h6 className="fw-bold mb-2">Contact Us</h6>
            <ul className="list-unstyled small mb-0">
              <li>Email: contact@cn.com</li>
              <li>Phone: (555) 123-4567</li>
              <li>Address: 123 Innovation Street</li>
            </ul>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="border-top border-secondary mt-2 pt-2 text-center">
          <p className="small mb-0">© {currentYear} CN. All rights reserved.</p>
        </div>
      </div>
    </footer>
    </>
  );
};

export default Footer;
