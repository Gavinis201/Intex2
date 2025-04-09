// Auth service to handle authentication across the application
import axios from 'axios';

const API_URL = 'https://localhost:5000/api/auth/';

// Configure axios to ignore SSL certificate validation in development
// axios.defaults.httpsAgent = new (require('https').Agent)({ rejectUnauthorized: false });

// Add a request interceptor to add the auth token to all requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
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
    
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('userEmail', email);
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

export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userEmail');
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
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('userEmail', authData.email);
    }
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const isAuthenticated = () => {
  return localStorage.getItem('authToken') !== null;
};

export const getCurrentUser = () => {
  return localStorage.getItem('userEmail');
};

export const getAuthToken = () => {
  return localStorage.getItem('authToken');
}; 