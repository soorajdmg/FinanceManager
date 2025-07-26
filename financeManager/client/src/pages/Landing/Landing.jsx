import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, TrendingUp, Shield, BarChart3, PieChart, ArrowRight, DollarSign, CheckCircle, AlertCircle, Bell, X } from 'lucide-react';
import './Landing.css';


const FlashMessage = ({ message, type, onRemove }) => {
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleRemove();
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove();
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="flash-message-icon" />;
      case 'error':
        return <AlertCircle className="flash-message-icon" />;
      case 'warning':
        return <AlertCircle className="flash-message-icon" />;
      case 'info':
        return <Bell className="flash-message-icon" />;
      default:
        return <AlertCircle className="flash-message-icon" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'success':
        return 'Success';
      case 'error':
        return 'Error';
      case 'warning':
        return 'Warning';
      case 'info':
        return 'Info';
      default:
        return 'Notification';
    }
  };

  return (
    <div className={`flash-message ${type} ${isRemoving ? 'removing' : ''}`}>
      <div className="flash-message-content">
        {getIcon()}
        <div className="flash-message-text">
          <p className="flash-message-title">{getTitle()}</p>
          <p className="flash-message-description">{message}</p>
        </div>
      </div>
      <button className="flash-message-close" onClick={handleRemove}>
        <X size={16} />
      </button>
      <div className="flash-message-progress"></div>
    </div>
  );
};

const Landing = ({ onAuthSuccess }) => {
  const [flashMessages, setFlashMessages] = useState([]);
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  // You should replace this with your actual backend URL
  const API_BASE_URL = 'http://localhost:5000/api';

  // Google OAuth Configuration - Replace with your actual Google Client ID
  const GOOGLE_CLIENT_ID = "724861474954-9qlfsuk8qjtnn7e9uj5vuhrb3frgm36p.apps.googleusercontent.com";


  useEffect(() => {
    setIsLoaded(true);
    // Load Google OAuth script
    loadGoogleScript();
  }, []);

  const loadGoogleScript = () => {
    if (window.google) {
      initializeGoogleSignIn();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogleSignIn;
    document.head.appendChild(script);
  };


  const handleGoogleCallback = async (response) => {
    setGoogleLoading(true);
    try {
      // Send the Google JWT token to your backend
      const result = await fetch(`${API_BASE_URL}/auth-google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: response.credential,
          action: isLogin ? 'login' : 'register'
        }),
      });

      const contentType = result.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await result.text();
        throw new Error(`Server error: ${textResponse}`);
      }

      const data = await result.json();

      if (!result.ok) {
        throw new Error(data.message || 'Google authentication failed');
      }

      // Store the token and user data
      const { token, user } = data.data;
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));

      addFlashMessage('Google authentication successful! Redirecting...', 'success');

      setTimeout(() => {
        onAuthSuccess(token);
      }, 1500);

    } catch (error) {
      console.error('Google OAuth error:', error);
      addFlashMessage(error.message || 'Google authentication failed', 'error');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    if (window.google) {
      // First try the prompt
      window.google.accounts.id.prompt((notification) => {
        console.log('Prompt notification:', notification);

        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Create a temporary button container
          const buttonContainer = document.createElement('div');
          buttonContainer.id = 'temp-google-button';
          buttonContainer.style.position = 'absolute';
          buttonContainer.style.top = '-9999px';
          document.body.appendChild(buttonContainer);

          // Render button with fixed width (use pixels instead of percentage)
          window.google.accounts.id.renderButton(
            buttonContainer,
            {
              theme: 'outline',
              size: 'large',
              width: 300, // Use pixels instead of percentage
              text: isLogin ? 'signin_with' : 'signup_with',
              shape: 'rectangular'
            }
          );

          // Trigger click on the rendered button
          setTimeout(() => {
            const button = buttonContainer.querySelector('[role="button"]');
            if (button) {
              button.click();
            }
            // Clean up
            document.body.removeChild(buttonContainer);
          }, 100);
        }
      });
    } else {
      console.error('Google SDK not loaded');
      addFlashMessage('Google sign-in is not available. Please try again.', 'error');
    }
  };

  // Also update your initialization
  const initializeGoogleSignIn = () => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback,
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: false // Add this to avoid FedCM issues
      });
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      return false;
    }

    if (!isLogin) {
      if (!formData.firstName || !formData.lastName) {
        setError('First name and last name are required');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return false;
      }
    }

    return true;
  };

  const handleLogin = async (loginData) => {
    try {
      console.log('Making login request to:', `${API_BASE_URL}/login`);

      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginData.email,
          password: loginData.password,
        }),
      });

      console.log('Response status:', response.status);

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.log('Non-JSON response:', textResponse);
        throw new Error(`Server error: ${textResponse}`);
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      const { token, user } = data.data;

      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));

      addFlashMessage('Login successful! Redirecting...', 'success');

      setTimeout(() => {
        onAuthSuccess(token);
      }, 1500);

      return data;
    } catch (error) {
      throw error;
    }
  };

  const handleSignup = async (signupData) => {
    try {
      console.log('Making register request to:', `${API_BASE_URL}/register`);

      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: signupData.firstName,
          lastName: signupData.lastName,
          email: signupData.email,
          password: signupData.password,
        }),
      });

      console.log('Response status:', response.status);

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.log('Non-JSON response:', textResponse);
        throw new Error(`Server error: ${textResponse}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      const { token, user } = data.data;

      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));

      addFlashMessage('Account created successfully! Redirecting...', 'success');

      setTimeout(() => {
        onAuthSuccess(token);
      }, 1500);

      return data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        await handleLogin(formData);
      } else {
        await handleSignup(formData);
      }
    } catch (error) {
      addFlashMessage(error.message || 'An error occurred. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: ''
    });
    setError('');
    setSuccess('');
  };

  const addFlashMessage = (message, type = 'info') => {
    const id = Date.now();
    setFlashMessages(prev => [...prev, { id, message, type }]);
  };

  const removeFlashMessage = (id) => {
    setFlashMessages(prev => prev.filter(msg => msg.id !== id));
  };

  return (
    <div className={`landing-container ${isLoaded ? 'loaded' : ''}`}>
      {/* Animated Background */}
      <div className="background-animation">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
        <div className="floating-shape shape-4"></div>
      </div>

      <div className="landing-content">
        {/* Left Side - Branding & Features */}
        <div className="landing-left">
          <div className="brand-section">
            <div className="logo-container">
              <div className="logo-icon">
                <DollarSign className="logo-svg" />
              </div>
              <h1 className="brand-title">FinanceFlow</h1>
            </div>
            <p className="brand-subtitle">
              Your Finances. Simplified.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <TrendingUp className="feature-icon-svg" />
              </div>
              <div className="feature-content">
                <h3 className="feature-title">Smart Analytics</h3>
                <p className="feature-description">Advanced insights into your spending patterns</p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Shield className="feature-icon-svg" />
              </div>
              <div className="feature-content">
                <h3 className="feature-title">Bank-Level Security</h3>
                <p className="feature-description">Your data is protected with enterprise security</p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <BarChart3 className="feature-icon-svg" />
              </div>
              <div className="feature-content">
                <h3 className="feature-title">Real-time Tracking</h3>
                <p className="feature-description">Monitor your finances as they happen</p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <PieChart className="feature-icon-svg" />
              </div>
              <div className="feature-content">
                <h3 className="feature-title">Budget Planning</h3>
                <p className="feature-description">Set goals and track your progress effortlessly</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="landing-right">
          <div className="auth-card">
            <div className="auth-header">
              <h2 className="auth-title">
                {isLogin ? 'Welcome Back' : 'Get Started'}
              </h2>
              <p className="auth-subtitle">
                {isLogin
                  ? 'Sign in to access your financial dashboard'
                  : 'Start managing your finances'
                }
              </p>
            </div>

            {/* Flash Messages */}
            <div className="flash-messages-container">
              {flashMessages.map((msg) => (
                <FlashMessage
                  key={msg.id}
                  message={msg.message}
                  type={msg.type}
                  onRemove={() => removeFlashMessage(msg.id)}
                />
              ))}
            </div>

              <button
                className={`social-button ${googleLoading ? 'loading' : ''}`}
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
              >
                {googleLoading ? (
                  <div className="loading-spinner"></div>
                ) : (
                  <svg viewBox="0 0 24 24" className="social-icon">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                {googleLoading ? 'Connecting...' : 'Continue with Google'}
              </button>

            {/* Hidden div for Google Sign-In button rendering */}
            <div id="google-signin-button" style={{ display: 'none' }}></div>

            <div className="social-divider">
              <span>or</span>
            </div>

            <div className="auth-form">
              {!isLogin && (
                <>
                  <div className="form-group name-group">
                    <div className="name-input-container">
                      <div className="name-field">
                        <label htmlFor="firstName" className="form-label">First Name</label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="form-input name-input"
                          placeholder="First name"
                          required
                        />
                      </div>
                      <div className="name-field">
                        <label htmlFor="lastName" className="form-label">Last Name</label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="form-input name-input"
                          placeholder="Last name"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="form-group">
                <label htmlFor="email" className="form-label">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="form-input password-input"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              )}

              {isLogin && (
                <div className="form-options">
                  <label className="remember-me">
                    <input type="checkbox" />
                    <span>Remember me</span>
                  </label>
                  <button type="button" className="forgot-password">Forgot password?</button>
                </div>
              )}

              <button
                type="submit"
                className={`submit-button ${isLoading ? 'loading' : ''}`}
                onClick={handleSubmit}
                disabled={isLoading}
              >
                <span>{isLoading ? 'Loading...' : (isLogin ? 'Sign In' : 'Create Account')}</span>
                {!isLoading && <ArrowRight className="submit-icon" />}
              </button>
            </div>

            <div className="auth-switch">
              <p>
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
                <button
                  type="button"
                  className="switch-button"
                  onClick={toggleAuthMode}
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;