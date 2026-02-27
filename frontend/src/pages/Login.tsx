import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Mail, Lock, ArrowRight, Sparkles, BarChart3, Target } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import './Login.css';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.email, formData.password);

    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Login failed');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="login-page">
      <ThemeToggle floating />
      {/* Left side - Branding */}
      <div className="login-hero">
        <div className="login-hero-content">
          <div className="login-brand">
            <Zap className="login-brand-icon" />
            <span>HCA Deal Intelligence</span>
          </div>
          <h1 className="login-hero-title">
            AI-Powered Deal Sourcing for Middle-Market M&A
          </h1>
          <p className="login-hero-subtitle">
            Discover companies likely to sell using AI signal analysis, generate research briefs, and create personalized outreach.
          </p>
          <div className="login-features">
            <div className="login-feature">
              <Sparkles size={20} />
              <span>Signal-based prospect scoring</span>
            </div>
            <div className="login-feature">
              <BarChart3 size={20} />
              <span>Real-time pipeline analytics</span>
            </div>
            <div className="login-feature">
              <Target size={20} />
              <span>AI-powered outreach generation</span>
            </div>
          </div>
        </div>
        <div className="login-hero-glow" />
      </div>

      {/* Right side - Login form */}
      <div className="login-form-section">
        <div className="login-form-container">
          <div className="login-form-header">
            <h2>Welcome back</h2>
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="login-link">Sign up here</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="login-error">
                {error}
              </div>
            )}

            <div className="login-field">
              <label htmlFor="email">Email address</label>
              <div className="login-input-wrapper">
                <Mail size={18} className="login-input-icon" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="password">Password</label>
              <div className="login-input-wrapper">
                <Lock size={18} className="login-input-icon" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div className="login-options">
              <label className="login-checkbox">
                <input type="checkbox" name="remember-me" />
                <span>Remember me</span>
              </label>
              <a href="#" className="login-link">Forgot password?</a>
            </div>

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="login-spinner" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="login-demo">
            <span className="login-demo-label">Demo Account</span>
            <div className="login-demo-creds">
              <span>demo@ai.com</span>
              <span className="login-demo-sep">/</span>
              <span>demo123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
