import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, TrendingUp, Shield, BarChart3, PieChart, ArrowRight, DollarSign } from 'lucide-react';
import './Landing.css';

const Landing = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle login/signup logic here
    console.log(isLogin ? 'Login' : 'Signup', formData);
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      fullName: ''
    });
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

            <div className="social-buttons">
              <button className="social-button google">
                <svg viewBox="0 0 24 24" className="social-icon">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>
              
              <button className="social-button apple">
                <svg viewBox="0 0 24 24" className="social-icon">
                  <path fill="currentColor" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                Apple
              </button>
            </div>

            <div className="social-divider">
              <span>or</span>
            </div>

            <div className="auth-form" onSubmit={handleSubmit}>
              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="fullName" className="form-label">Full Name</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
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

              <button type="submit" className="submit-button" onClick={handleSubmit}>
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="submit-icon" />
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