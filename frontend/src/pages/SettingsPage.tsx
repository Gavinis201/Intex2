import { useEffect, useState } from 'react';
import { getTheme, toggleTheme } from '../services/themeService';
import { isAuthenticated } from '../services/authService';
import { useNavigate } from 'react-router-dom';

const SettingsPage = () => {
  const [isLightMode, setIsLightMode] = useState(getTheme() === 'light');
  const navigate = useNavigate();

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

  return (
    <div className="settings-page">
      <h1 className="settings-title">Settings</h1>
      
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
        <h3>Account Settings</h3>
        <p>
          More settings will be available in future updates.
        </p>
      </div>
    </div>
  );
};

export default SettingsPage; 