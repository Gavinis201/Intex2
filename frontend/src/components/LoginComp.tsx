import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../Matt.css';
import { login } from '../services/authService';

// Helper function to set a secure cookie
const setCookie = (name: string, value: string, days: number) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;secure;samesite=strict`;
};

const LoginComp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await login(email, password);
      console.log('Login response:', response);
      
      if (response.success) {
        // Set auth cookie (7 days expiry)
        if (response.token) {
          setCookie('authToken', response.token, 7);
          setCookie('userEmail', email, 7);
        }
        
        // Redirect to the page the user was trying to access, or MoviePage by default
        const from = location.state?.from?.pathname || '/MoviePage';
        navigate(from, { replace: true });
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Sign In</h2>
        {error && <div className="error-message">{error}</div>}
        <div className="form-group">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button 
          type="submit" 
          className="login-button"
          disabled={loading}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
        <div className="login-footer">
          <p>New to CineNiche? <Link to="/CreateAccount">Sign up now</Link></p>
        </div>
      </form>
    </div>
  );
};

export default LoginComp; 