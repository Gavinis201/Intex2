import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXTwitter,
  faInstagram,
  faYoutube,
  faLinkedin,
} from "@fortawesome/free-brands-svg-icons";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-black text-white py-4 border-top">
      <div className="container d-flex justify-content-between align-items-start flex-wrap">
        {/* Left - Logo + Icons */}
        <div className="d-flex flex-column align-items-start">
          <img
            src="/CN-logo.png" // replace with your actual logo path
            alt="CineNiche Logo"
            style={{ width: "50px", marginBottom: "10px" }}
          />
          <div className="d-flex gap-3">
            <a href="https://x.com" target="_blank" rel="noreferrer">
              <FontAwesomeIcon icon={faXTwitter} size="lg" color="white" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer">
              <FontAwesomeIcon icon={faInstagram} size="lg" color="white" />
            </a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer">
              <FontAwesomeIcon icon={faYoutube} size="lg" color="white" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer">
              <FontAwesomeIcon icon={faLinkedin} size="lg" color="white" />
            </a>
          </div>
        </div>

        {/* Right - Quick Links */}
        <div>
          <h6 className="fw-bold">Quick Links</h6>
          <ul className="list-unstyled">
            <li>
              <Link to="/faq" className="text-white text-decoration-none">
                FAQ
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="text-white text-decoration-none">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/contact" className="text-white text-decoration-none">
                Contact Us
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
