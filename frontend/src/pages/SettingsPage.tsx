import { useEffect, useState } from 'react';
import { getTheme, toggleTheme } from '../services/themeService';
import { isAuthenticated, setupTwoFactor, verifyAuthenticator, disableTwoFactor } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import '../Matt.css';

// Define the TwoFactorSetupData interface
interface TwoFactorSetupData {
  sharedKey: string;
  authenticatorUri: string;
  recoveryCodes: string[];
  success: boolean;
  message: string;
}

const SettingsPage = () => {
  const [isLightMode, setIsLightMode] = useState(getTheme() === 'light');
  const navigate = useNavigate();
  const [twoFactorSetupData, setTwoFactorSetupData] = useState<TwoFactorSetupData | null>(null);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  const handleThemeToggle = () => {
    const newTheme = toggleTheme();
    setIsLightMode(newTheme === 'light');
  };

  const handleSetupTwoFactor = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const response = await setupTwoFactor();
      setTwoFactorSetupData(response);
      setShowTwoFactorSetup(true);
    } catch (error) {
      setError('Failed to setup two-factor authentication. Please try again.');
      console.error('Error setting up 2FA:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTwoFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const response = await verifyAuthenticator(verificationCode);
      if (response.success) {
        setTwoFactorEnabled(true);
        setShowTwoFactorSetup(false);
        setTwoFactorSetupData(null);
        setSuccess('Two-factor authentication has been enabled successfully.');
      } else {
        setError(response.message || 'Failed to verify code.');
      }
    } catch (error) {
      setError('Failed to verify code. Please check and try again.');
      console.error('Error verifying 2FA code:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisableTwoFactor = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const response = await disableTwoFactor();
      if (response.success) {
        setTwoFactorEnabled(false);
        setSuccess('Two-factor authentication has been disabled.');
      } else {
        setError(response.message || 'Failed to disable two-factor authentication.');
      }
    } catch (error) {
      setError('Failed to disable two-factor authentication. Please try again.');
      console.error('Error disabling 2FA:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-page">
      <h1 className="settings-title">Settings</h1>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <div className="settings-card">
        <h3>Display Settings</h3>
        
        <div className="theme-toggle">
          <div>
            <h5>Light Mode</h5>
            <p>Switch between dark and light appearance</p>
          </div>
          
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={isLightMode} 
              onChange={handleThemeToggle}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>
      
      <div className="settings-card">
        <h3>Security Settings</h3>
        
        <div className="two-factor-section">
          <div>
            <h5>Two-Factor Authentication</h5>
            <p>Add an extra layer of security to your account with an authenticator app</p>
          </div>
          
          {!showTwoFactorSetup && !twoFactorEnabled && (
            <button 
              className="btn-primary"
              onClick={handleSetupTwoFactor}
              disabled={loading}
            >
              {loading ? 'Setting up...' : 'Setup 2FA'}
            </button>
          )}
          
          {twoFactorEnabled && (
            <button 
              className="btn-danger"
              onClick={handleDisableTwoFactor}
              disabled={loading}
            >
              {loading ? 'Disabling...' : 'Disable 2FA'}
            </button>
          )}
        </div>
        
        {showTwoFactorSetup && twoFactorSetupData && (
          <div className="two-factor-setup">
            <h4>Setup Two-Factor Authentication</h4>
            <p>1. Scan the QR code with your authenticator app (like Google Authenticator or Authy)</p>
            
            <div className="qr-code-container">
              <img 
                src={`https://chart.googleapis.com/chart?cht=qr&chs=200x200&chl=${encodeURIComponent(twoFactorSetupData.authenticatorUri)}`} 
                alt="QR Code for 2FA" 
              />
            </div>
            
            <p>2. Or manually enter this code in your app: <code>{twoFactorSetupData.sharedKey}</code></p>
            
            <p>3. Enter the verification code from your app:</p>
            <form onSubmit={handleVerifyTwoFactor}>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                />
              </div>
              <button 
                type="submit" 
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify & Enable'}
              </button>
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => {
                  setShowTwoFactorSetup(false);
                  setTwoFactorSetupData(null);
                }}
                disabled={loading}
              >
                Cancel
              </button>
            </form>
            
            <div className="recovery-codes">
              <h4>Recovery Codes</h4>
              <p>Save these recovery codes in a secure place. They can be used to access your account if you lose your authenticator device.</p>
              <ul>
                {twoFactorSetupData.recoveryCodes && twoFactorSetupData.recoveryCodes.map((code: string, index: number) => (
                  <li key={index}><code>{code}</code></li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
      
      <div className="settings-card">
        <h3>Account Settings</h3>
        <p>
          More settings will be available in future updates.
        </p>
      </div>
    </div>
  );
};

export default SettingsPage; 