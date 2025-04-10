import { useState, useEffect } from 'react';
import '../App.css';
import { getAuthToken, getCurrentUser, getUserId, getMoviesUserId } from '../services/authService';

// Create a custom event for consent changes 
export const consentChangeEvent = new Event('consentChange');

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  // Function to set cookies if user is already authenticated
  const syncAuthDataToCookies = () => {
    // Check if user is authenticated via localStorage 
    const token = localStorage.getItem('authToken');
    const email = localStorage.getItem('userEmail');
    const userId = localStorage.getItem('userId');
    const moviesUserId = localStorage.getItem('moviesUserId');
    
    if (token) {
      // The user is authenticated, so set the cookies from localStorage data
      // Get token expiry by decoding JWT
      let expiry = new Date();
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp) {
          expiry = new Date(payload.exp * 1000); // Convert from Unix timestamp
        } else {
          // If no expiry in token, set to 24 hours
          expiry.setHours(expiry.getHours() + 24);
        }
      } catch (e) {
        console.error('Error parsing token expiry:', e);
        // Default expiry: 24 hours from now
        expiry.setHours(expiry.getHours() + 24);
      }
      
      // Set cookie expiry date string
      const expires = `expires=${expiry.toUTCString()}`;
      
      // Set cookies
      document.cookie = `authToken=${token}; ${expires}; path=/; secure; samesite=strict`;
      if (email) document.cookie = `userEmail=${email}; ${expires}; path=/; secure; samesite=strict`;
      if (userId) document.cookie = `userId=${userId}; ${expires}; path=/; secure; samesite=strict`;
      if (moviesUserId) document.cookie = `moviesUserId=${moviesUserId}; ${expires}; path=/; secure; samesite=strict`;
      
      console.log('Synchronized authentication data to cookies');
    }
  };

  // Function to remove all cookies
  const removeAllCookies = () => {
    const cookies = document.cookie.split(';');
    
    for (let cookie of cookies) {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
    
    console.log('Removed all cookies');
  };

  useEffect(() => {
    // Check if user has already given consent
    const consent = localStorage.getItem('cookieConsent');
    
    if (!consent) {
      // If no consent found, show the banner
      setVisible(true);
    } else if (consent === 'accepted') {
      // If consent is accepted, ensure cookies are synchronized
      syncAuthDataToCookies();
    }
  }, []);

  const acceptCookies = () => {
    // Save consent to localStorage
    localStorage.setItem('cookieConsent', 'accepted');
    
    // Synchronize auth data to cookies if user is logged in
    syncAuthDataToCookies();
    
    // Dispatch the event to notify listeners
    window.dispatchEvent(consentChangeEvent);
    
    // Update component state
    setVisible(false);
  };

  const declineCookies = () => {
    // Save declined consent
    localStorage.setItem('cookieConsent', 'declined');
    
    // Remove any existing cookies
    removeAllCookies();
    
    // Dispatch the event to notify listeners
    window.dispatchEvent(consentChangeEvent);
    
    // Update component state
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cookie-consent-container">
      <div className="cookie-consent-content">
        <h4>Cookie Consent</h4>
        <p>
          We use cookies to enhance your browsing experience, serve personalized ads or content, 
          and analyze our traffic. By clicking "Accept All Cookies", you consent to our use of cookies.
          This includes cookies for authentication and security purposes. For more information, 
          please visit our <a href="/Privacy">Privacy Policy</a>.
        </p>
        <div className="cookie-consent-buttons">
          <button 
            className="cookie-button cookie-button-accept" 
            onClick={acceptCookies}
          >
            Accept All Cookies
          </button>
          <button 
            className="cookie-button cookie-button-decline" 
            onClick={declineCookies}
          >
            Decline Non-Essential Cookies
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent; 