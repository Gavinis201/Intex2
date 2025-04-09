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
                        <p>We will contact you shortly!</p>
                        <button 
                            onClick={() => navigate('/login')} 
                            className="submit-button"
                            style={{ marginTop: '2rem' }}
                        >
                            Sign In
                        </button>
                    </section>
                </div>
            </div>
        </div>
    );
}

export default ThankYouPage; 