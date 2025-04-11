// Auth service to handle authentication across the application
import axios from 'axios';

const API_URL = 'https://localhost:5000/api/auth/';

// Helper function to get a cookie value
const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

// Helper function to check cookie consent
const hasCookieConsent = (): boolean => {
  return localStorage.getItem('cookieConsent') === 'accepted';
};

// Configure axios to ignore SSL certificate validation in development
// axios.defaults.httpsAgent = new (require('https').Agent)({ rejectUnauthorized: false });

// Add a request interceptor to add the auth token to all requests
axios.interceptors.request.use(
  (config) => {
    // Only use cookies if the user has given consent, otherwise use localStorage
    const useLocalStorageOnly = !hasCookieConsent();
    
    // Try to get token from appropriate storage
    const token = useLocalStorageOnly 
      ? localStorage.getItem('authToken') 
      : (getCookie('authToken') || localStorage.getItem('authToken'));
      
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const login = async (email: string, password: string) => {
  try {
    console.log('Attempting login for:', email);
    const response = await axios.post(API_URL + 'login', { email, password });
    console.log('Login API response:', response.data);
    
    // Check if two-factor authentication is required
    if (response.data.requiresTwoFactor) {
      console.log('Two-factor authentication required');
      return {
        ...response.data,
        email // Store the email for the 2FA step
      };
    }
    
    if (response.data.token) {
      // Always store in localStorage for fallback
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('userEmail', email);
      
      // Extract userId and moviesUserId from token payload
      let userId = null;
      let moviesUserId = null;
      
      try {
        const tokenPayload = JSON.parse(atob(response.data.token.split('.')[1]));
        userId = tokenPayload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
        moviesUserId = tokenPayload['MoviesUserId'];
        
        if (userId) {
          localStorage.setItem('userId', userId);
        }
        if (moviesUserId) {
          localStorage.setItem('moviesUserId', moviesUserId);
        }
      } catch (e) {
        console.error('Failed to parse token:', e);
      }
      
      // If user has already consented to cookies, set them immediately
      if (hasCookieConsent()) {
        const expires = new Date(response.data.expiration).toUTCString();
        document.cookie = `authToken=${response.data.token}; expires=${expires}; path=/; secure; samesite=strict`;
        document.cookie = `userEmail=${email}; expires=${expires}; path=/; secure; samesite=strict`;
        
        if (userId) {
          document.cookie = `userId=${userId}; expires=${expires}; path=/; secure; samesite=strict`;
        }
        
        if (moviesUserId) {
          document.cookie = `moviesUserId=${moviesUserId}; expires=${expires}; path=/; secure; samesite=strict`;
        }
        
        console.log('Set auth cookies after login with consent');
      }
    }
    return response.data;
  } catch (error: any) {
    console.error('Login error details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers
    });
    
    // For 500 errors, provide a clearer message
    if (error.response?.status === 500) {
      throw new Error('Server error occurred. The server might be misconfigured or the database might not be properly set up.');
    }
    throw error;
  }
};

export const verifyTwoFactorCode = async (email: string, code: string, rememberDevice: boolean = false) => {
  try {
    console.log(`Verifying two-factor code for ${email}`);
    const response = await axios.post(API_URL + 'two-factor-verify', { email, code, rememberDevice });
    console.log('Two-factor verification response:', response.data);
    
    if (response.data.token) {
      // Always store in localStorage for fallback
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('userEmail', email);
      
      // Extract userId and moviesUserId from token payload
      let userId = null;
      let moviesUserId = null;
      
      try {
        const tokenPayload = JSON.parse(atob(response.data.token.split('.')[1]));
        userId = tokenPayload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
        moviesUserId = tokenPayload['MoviesUserId'];
        
        if (userId) {
          localStorage.setItem('userId', userId);
        }
        if (moviesUserId) {
          localStorage.setItem('moviesUserId', moviesUserId);
        }
      } catch (e) {
        console.error('Failed to parse token:', e);
      }
      
      // If user has already consented to cookies, set them immediately
      if (hasCookieConsent()) {
        const expires = new Date(response.data.expiration).toUTCString();
        document.cookie = `authToken=${response.data.token}; expires=${expires}; path=/; secure; samesite=strict`;
        document.cookie = `userEmail=${email}; expires=${expires}; path=/; secure; samesite=strict`;
        
        if (userId) {
          document.cookie = `userId=${userId}; expires=${expires}; path=/; secure; samesite=strict`;
        }
        
        if (moviesUserId) {
          document.cookie = `moviesUserId=${moviesUserId}; expires=${expires}; path=/; secure; samesite=strict`;
        }
      }
    }
    
    return response.data;
  } catch (error: any) {
    console.error('Two-factor verification error:', error);
    throw error;
  }
};

export const setupTwoFactor = async () => {
  try {
    const response = await axios.post(API_URL + 'two-factor-setup');
    return response.data;
  } catch (error) {
    console.error('Error setting up two-factor authentication:', error);
    throw error;
  }
};

export const verifyAuthenticator = async (code: string) => {
  try {
    const email = getCurrentUser();
    const response = await axios.post(API_URL + 'verify-authenticator', { code, email });
    return response.data;
  } catch (error) {
    console.error('Error verifying authenticator code:', error);
    throw error;
  }
};

export const disableTwoFactor = async () => {
  try {
    const response = await axios.post(API_URL + 'disable-two-factor');
    return response.data;
  } catch (error) {
    console.error('Error disabling two-factor authentication:', error);
    throw error;
  }
};

export const logout = () => {
  // Clear localStorage
  localStorage.removeItem('authToken');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userId');
  localStorage.removeItem('moviesUserId');
  
  // Clear cookies if we have consent to use them
  if (hasCookieConsent()) {
    document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'userEmail=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'moviesUserId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  }
};

export const register = async (userData: any, authData: any) => {
  try {
    // First try to create a user (this might fail if user exists)
    try {
      await axios.post('https://localhost:5000/api/users', userData);
    } catch (error: any) {
      // If not a "user exists" error, throw it
      if (!error.response?.data?.message?.includes('already exists')) {
        throw error;
      }
    }
    
    // Then register with auth system
    const response = await axios.post(API_URL + 'register', authData);
    if (response.data.token) {
      // Always store in localStorage for fallback
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('userEmail', authData.email);
      
      // Extract userId and moviesUserId from token payload
      let userId = null;
      let moviesUserId = null;
      
      try {
        const tokenPayload = JSON.parse(atob(response.data.token.split('.')[1]));
        userId = tokenPayload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
        moviesUserId = tokenPayload['MoviesUserId'];
        
        if (userId) {
          localStorage.setItem('userId', userId);
        }
        if (moviesUserId) {
          localStorage.setItem('moviesUserId', moviesUserId);
        }
      } catch (e) {
        console.error('Failed to parse token:', e);
      }
      
      // If user has already consented to cookies, set them immediately
      if (hasCookieConsent()) {
        const expires = new Date(response.data.expiration).toUTCString();
        document.cookie = `authToken=${response.data.token}; expires=${expires}; path=/; secure; samesite=strict`;
        document.cookie = `userEmail=${authData.email}; expires=${expires}; path=/; secure; samesite=strict`;
        
        if (userId) {
          document.cookie = `userId=${userId}; expires=${expires}; path=/; secure; samesite=strict`;
        }
        
        if (moviesUserId) {
          document.cookie = `moviesUserId=${moviesUserId}; expires=${expires}; path=/; secure; samesite=strict`;
        }
        
        console.log('Set auth cookies after registration with consent');
      }
    }
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const isAuthenticated = () => {
  // Check both cookie and localStorage based on consent settings
  if (hasCookieConsent()) {
    return getCookie('authToken') !== null || localStorage.getItem('authToken') !== null;
  } else {
    // If no cookie consent, only check localStorage
    return localStorage.getItem('authToken') !== null;
  }
};

export const getCurrentUser = () => {
  // Try appropriate storage based on consent
  if (hasCookieConsent()) {
    return getCookie('userEmail') || localStorage.getItem('userEmail');
  } else {
    return localStorage.getItem('userEmail');
  }
};

export const getAuthToken = () => {
  // Try appropriate storage based on consent
  if (hasCookieConsent()) {
    return getCookie('authToken') || localStorage.getItem('authToken');
  } else {
    return localStorage.getItem('authToken');
  }
};

export const getUserId = () => {
  // Try appropriate storage based on consent
  if (hasCookieConsent()) {
    return getCookie('userId') || localStorage.getItem('userId');
  } else {
    return localStorage.getItem('userId');
  }
};

export const getMoviesUserId = () => {
  // Try appropriate storage based on consent
  if (hasCookieConsent()) {
    return getCookie('moviesUserId') || localStorage.getItem('moviesUserId');
  } else {
    return localStorage.getItem('moviesUserId');
  }
};

export const isAdmin = async () => {
  const token = getAuthToken();
  if (!token) return false;
  
  try {
    // Decode the JWT token
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));
    
    // Add debugging
    console.log('JWT Token Payload:', payload);
    console.log('Role claim:', payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']);
    console.log('MoviesUserId:', payload['MoviesUserId']);
    
    // Get the role claim value
    const roleClaim = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    
    // Check if the role claim exists and includes Administrator
    const hasAdminRole = payload && 
          (roleClaim === 'Administrator' ||
           (Array.isArray(roleClaim) && roleClaim.includes('Administrator')) ||
           (payload.roles && payload.roles.includes('Administrator')));
    
    // If we already have admin role in JWT, return true
    if (hasAdminRole) {
      console.log('User has Administrator role in JWT claims');
      return true;
    }
    
    // If no admin role in JWT but we have a MoviesUserId, check the database
    const moviesUserId = payload['MoviesUserId'];
    if (moviesUserId) {
      console.log(`Checking admin status for MoviesUserId: ${moviesUserId}`);
      try {
        // Call the backend to check admin status
        const response = await fetch(`https://localhost:5000/api/users/check-admin/${moviesUserId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Admin check result:', data);
          return data.isAdmin;
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error parsing JWT token:', error);
    return false;
  }
}; 