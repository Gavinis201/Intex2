import '../App.css'
import './CreateAccount.css'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Configure axios to ignore SSL certificate validation in development
// axios.defaults.httpsAgent = new (require('https').Agent)({ rejectUnauthorized: false });

function CreateAccount() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        age: '',
        gender: '',
        city: '',
        state: '',
        zip: ''
    });
    
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        
        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }
        
        try {
            // First, create a user in the movies_users table
            const userData = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                age: formData.age ? parseInt(formData.age) : null,
                gender: formData.gender,
                city: formData.city,
                state: formData.state,
                zip: formData.zip ? parseInt(formData.zip) : null
            };
            
            console.log('Creating user with data:', userData);
            
            try {
                // Create user in MoviesUsers table - this will either create a new user or fail if user exists
                await axios.post('https://localhost:5000/api/users', userData).catch(error => {
                    // If the error is NOT "user already exists", throw it to be caught in the outer catch
                    if (!error.response?.data?.message?.includes("already exists")) {
                        throw error;
                    }
                    console.log('User already exists, proceeding to auth registration');
                });
                
                // Then register with auth system
                const authData = {
                    email: formData.email,
                    password: formData.password,
                    confirmPassword: formData.confirmPassword
                };
                
                console.log('Registering with auth system:', { email: authData.email });
                
                // Register with auth system
                const response = await axios.post('https://localhost:5000/api/auth/register', authData);
                
                console.log('Auth registration response:', response.data);
                
                if (response.data.success) {
                    // Redirect to login page after successful registration
                    navigate('/login');
                } else {
                    setError(response.data.message || 'Registration failed');
                }
            } catch (error: any) {
                console.error('Error details:', {
                    message: error.message,
                    response: error.response?.data,
                    status: error.response?.status,
                    headers: error.response?.headers
                });
                throw error;
            }
        } catch (error: any) {
            console.error('Registration error:', error);
            setError(error.response?.data?.message || error.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="background-color">
            <div className="blackOp">
                <h1 className='privacy-color'>Create Account</h1>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit} className="create-account-form">
                    <div className="form-group">
                        <label htmlFor="name">Full Name:</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email:</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password:</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            minLength={8}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password:</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            minLength={8}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="phone">Phone Number:</label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="age">Age:</label>
                        <input
                            type="number"
                            id="age"
                            name="age"
                            value={formData.age}
                            onChange={handleChange}
                            min="1"
                            max="120"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="gender">Gender:</label>
                        <select
                            id="gender"
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                        >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                            <option value="prefer-not-to-say">Prefer not to say</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="city">City:</label>
                        <input
                            type="text"
                            id="city"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="state">State:</label>
                        <input
                            type="text"
                            id="state"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="zip">ZIP Code:</label>
                        <input
                            type="text"
                            id="zip"
                            name="zip"
                            value={formData.zip}
                            onChange={handleChange}
                            pattern="[0-9]{5}"
                            title="5-digit ZIP code"
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="submit-button" 
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default CreateAccount;