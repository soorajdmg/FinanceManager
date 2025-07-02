import React, { useState, useEffect } from 'react';
import { TrendingUp, Shield, BarChart3, DollarSign, ArrowRight, CheckCircle } from 'lucide-react';
import './Landing.css';

const Landing = ({ 
  LoginComponent, 
  SignupComponent, 
  onLoginSuccess, 
  onSignupSuccess 
}) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const features = [
    {
      icon: <BarChart3 className="feature-icon" />,
      title: "Smart Analytics",
      description: "Understand your spending patterns with AI-powered insights"
    },
    {
      icon: <Shield className="feature-icon" />,
      title: "Bank-Level Security",
      description: "Your data is protected with enterprise-grade encryption"
    },
    {
      icon: <TrendingUp className="feature-icon" />,
      title: "Financial Growth",
      description: "Track your progress and achieve your financial goals"
    }
  ];

  const trustIndicators = [
    "50,000+ Users Trust Us",
    "Bank-Grade Security",
    "99.9% Uptime Guaranteed"
  ];

  return (
    <div className={`landing-container ${isLoaded ? 'loaded' : ''}`}>
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-brand">
            <DollarSign className="brand-icon" />
            <span className="brand-text">FinanceTracker</span>
          </div>
          <div className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#security" className="nav-link">Security</a>
            <a href="#contact" className="nav-link">Contact</a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="landing-main">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              Your Finances.
              <span className="title-highlight"> Simplified.</span>
            </h1>
            
            <p className="hero-description">
              Transform your financial data into actionable insights. 
              Secure, simple, and designed for your success.
            </p>

            <div className="trust-indicators">
              {trustIndicators.map((indicator, index) => (
                <div key={index} className="trust-item">
                  <CheckCircle className="trust-icon" />
                  <span>{indicator}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Auth Section */}
        <section className="auth-section">
          <div className="auth-container">
            <div className="auth-header">
              <h2 className="auth-title">
                {isLogin ? 'Welcome Back' : 'Get Started Today'}
              </h2>
              <p className="auth-subtitle">
                {isLogin 
                  ? 'Sign in to access your financial dashboard' 
                  : 'Join thousands of users taking control of their finances'
                }
              </p>
            </div>

            <div className="auth-tabs">
              <button 
                className={`auth-tab ${isLogin ? 'active' : ''}`}
                onClick={() => setIsLogin(true)}
              >
                Sign In
              </button>
              <button 
                className={`auth-tab ${!isLogin ? 'active' : ''}`}
                onClick={() => setIsLogin(false)}
              >
                Sign Up
              </button>
            </div>

            <div className="auth-form-container">
              {isLogin ? (
                LoginComponent ? (
                  <LoginComponent 
                    onLoginSuccess={onLoginSuccess}
                    embedded={true}
                  />
                ) : (
                  <div className="auth-placeholder">
                    <p>Login component will appear here</p>
                  </div>
                )
              ) : (
                SignupComponent ? (
                  <SignupComponent 
                    onSignupSuccess={onSignupSuccess}
                    embedded={true}
                  />
                ) : (
                  <div className="auth-placeholder">
                    <p>Signup component will appear here</p>
                  </div>
                )
              )}
            </div>

            <div className="auth-footer">
              <p className="auth-switch">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button 
                  className="auth-switch-btn"
                  onClick={() => setIsLogin(!isLogin)}
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                  <ArrowRight className="switch-icon" />
                </button>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Landing;