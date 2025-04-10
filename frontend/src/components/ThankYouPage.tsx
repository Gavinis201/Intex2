import '../App.css';
import { useNavigate } from 'react-router-dom';

function ThankYouPage() {
  const navigate = useNavigate();

  return (
    <div className="background-color">
      <div className="blackOp">
        <div className="privacy-start">
          <section className="privacy-section">
            <h2>Thank You!</h2>
            <p>We have received your message and will contact you shortly.</p>
            <div className="button-container">
              <button 
                className="nav-button"
                onClick={() => navigate('/')}
              >
                Go to Home
              </button>
              <button 
                className="nav-button"
                onClick={() => navigate('/login')}
              >
                Go to Login
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default ThankYouPage; 