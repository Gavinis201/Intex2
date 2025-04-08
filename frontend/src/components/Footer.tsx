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
  return (
    <footer
      className="bg-black text-white py-4 border-top"
      style={{ marginTop: "auto" }}
    >
      <div className="container d-flex justify-content-between align-items-start flex-wrap">
        {/* Left - Logo + Icons */}
        <div className="d-flex flex-column align-items-start">
          <h2 className="textpurple">CN</h2>
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
              <Link to="/FAQ" className="text-white text-decoration-none">
                FAQ
              </Link>
            </li>
            <li>
              <Link to="/Privacy" className="text-white text-decoration-none">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/Contact" className="text-white text-decoration-none">
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
