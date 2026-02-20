import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, User, Mail, Lock, Building2, ArrowRight, CheckCircle } from 'lucide-react';
import './Register.css';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    const result = await register(
      formData.email,
      formData.password,
      formData.name,
      formData.company
    );

    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Registration failed');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="register-page">
      {/* Left side - Branding */}
      <div className="register-hero">
        <div className="register-hero-content">
          <div className="register-brand">
            <Zap className="register-brand-icon" />
            <span>HCA Deal Intelligence</span>
          </div>
          <h1 className="register-hero-title">
            Start Your Deal Sourcing Journey
          </h1>
          <p className="register-hero-subtitle">
            Join investment banks and PE firms using AI to identify middle-market acquisition targets.
          </p>
          <div className="register-features">
            <div className="register-feature">
              <CheckCircle size={20} />
              <span>AI-powered prospect scoring</span>
            </div>
            <div className="register-feature">
              <CheckCircle size={20} />
              <span>Setup takes less than 5 minutes</span>
            </div>
            <div className="register-feature">
              <CheckCircle size={20} />
              <span>Full pipeline management tools</span>
            </div>
          </div>
        </div>
        <div className="register-hero-glow" />
      </div>

      {/* Right side - Register form */}
      <div className="register-form-section">
        <div className="register-form-container">
          <div className="register-form-header">
            <h2>Create your account</h2>
            <p>
              Already have an account?{' '}
              <Link to="/login" className="register-link">Sign in here</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="register-form">
            {error && (
              <div className="register-error">
                {error}
              </div>
            )}

            <div className="register-field">
              <label htmlFor="name">Full Name</label>
              <div className="register-input-wrapper">
                <User size={18} className="register-input-icon" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div className="register-field">
              <label htmlFor="email">Email address</label>
              <div className="register-input-wrapper">
                <Mail size={18} className="register-input-icon" />
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

            <div className="register-field">
              <label htmlFor="company">Company (optional)</label>
              <div className="register-input-wrapper">
                <Building2 size={18} className="register-input-icon" />
                <input
                  id="company"
                  name="company"
                  type="text"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Your company name"
                />
              </div>
            </div>

            <div className="register-row">
              <div className="register-field">
                <label htmlFor="password">Password</label>
                <div className="register-input-wrapper">
                  <Lock size={18} className="register-input-icon" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 6 characters"
                  />
                </div>
              </div>

              <div className="register-field">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="register-input-wrapper">
                  <Lock size={18} className="register-input-icon" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat password"
                  />
                </div>
              </div>
            </div>

            <div className="register-terms">
              <label className="register-checkbox">
                <input type="checkbox" name="terms" required />
                <span>
                  I agree to the{' '}
                  <a href="#" className="register-link">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="register-link">Privacy Policy</a>
                </span>
              </label>
            </div>

            <button type="submit" className="register-submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="register-spinner" />
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
