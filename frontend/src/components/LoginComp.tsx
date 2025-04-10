import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../Matt.css';
import { login, verifyTwoFactorCode } from '../services/authService';

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
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);
  const [twoFactorEmail, setTwoFactorEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await login(email, password);
      console.log('Login response:', response);
      
      if (response.requiresTwoFactor) {
        // Store email for the 2FA step and show 2FA form
        setTwoFactorRequired(true);
        setTwoFactorEmail(response.email);
        setLoading(false);
        return;
      }
      
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

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await verifyTwoFactorCode(twoFactorEmail, twoFactorCode, rememberDevice);
      
      if (response.success) {
        // Set auth cookie (7 days expiry)
        if (response.token) {
          setCookie('authToken', response.token, 7);
          setCookie('userEmail', twoFactorEmail, 7);
        }
        
        // Redirect to the page the user was trying to access, or MoviePage by default
        const from = location.state?.from?.pathname || '/MoviePage';
        navigate(from, { replace: true });
      } else {
        setError(response.message || 'Verification failed');
      }
    } catch (error: any) {
      console.error('Two-factor verification error:', error);
      setError(error.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {!twoFactorRequired ? (
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
      ) : (
        <form onSubmit={handleTwoFactorSubmit} className="login-form">
          <h2>Two-Factor Authentication</h2>
          {error && <div className="error-message">{error}</div>}
          <p>Enter the verification code from your authenticator app</p>
          <div className="form-group">
            <input
              type="text"
              placeholder="Authentication code"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value)}
              maxLength={6}
              pattern="[0-9]{6}"
              required
            />
          </div>
          <div className="form-group checkbox">
            <input
              type="checkbox"
              id="remember-device"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
            />
            <label htmlFor="remember-device">Remember this device</label>
          </div>
          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
          <div className="login-footer">
            <p><Link to="/login" onClick={() => setTwoFactorRequired(false)}>Back to login</Link></p>
          </div>
        </form>
      )}
    </div>
  );
};

export default LoginComp; 