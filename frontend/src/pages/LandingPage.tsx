import {
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle,
  DollarSign,
  Play,
  Rocket,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';
import './LandingPage.css';

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="landing-page">
      {/* Animated Background */}
      <div className="animated-bg"></div>

      {/* Navigation */}
      <nav className="navbar glass">
        <div className="container flex-between">
          <div className="logo">
            <Sparkles className="logo-icon" />
            <span className="logo-text">AI Marketing Platform</span>
          </div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#pricing">Pricing</a>
            <a href="/dashboard" className="btn btn-primary">Get Started</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content fade-in">
            <div className="badge mb-2">
              <Zap size={16} />
              <span>Powered by Advanced AI</span>
            </div>
            <h1 className="hero-title">
              Transform Your Marketing
              <br />
              with <span className="gradient-text">AI-Powered Ads</span>
            </h1>
            <p className="hero-subtitle">
              Create stunning ad campaigns, generate AI content, and track ROI across Meta, Google, and TikTok.
              All from one powerful platform.
            </p>
            <div className="hero-cta">
              <button className="btn btn-primary btn-large">
                <Rocket size={20} />
                Start Free Trial
              </button>
              <button className="btn btn-secondary btn-large">
                <Play size={20} />
                Watch Demo
              </button>
            </div>

            {/* Stats */}
            <div className="hero-stats">
              <div className="stat">
                <div className="stat-value">300%</div>
                <div className="stat-label">Average ROI Increase</div>
              </div>
              <div className="stat">
                <div className="stat-value">10K+</div>
                <div className="stat-label">Campaigns Created</div>
              </div>
              <div className="stat">
                <div className="stat-value">$50M+</div>
                <div className="stat-label">Ad Spend Managed</div>
              </div>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="hero-visual" style={{ transform: `translateY(${scrollY * 0.1}px)` }}>
            <div className="dashboard-preview card-gradient glass">
              <div className="preview-header">
                <div className="preview-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="preview-title">Campaign Dashboard</div>
              </div>
              <div className="preview-content">
                <div className="metric-card">
                  <TrendingUp className="metric-icon" />
                  <div className="metric-value">+245%</div>
                  <div className="metric-label">ROI This Month</div>
                </div>
                <div className="metric-card">
                  <Users className="metric-icon" />
                  <div className="metric-value">1.2M</div>
                  <div className="metric-label">Impressions</div>
                </div>
                <div className="metric-card">
                  <DollarSign className="metric-icon" />
                  <div className="metric-value">$45K</div>
                  <div className="metric-label">Revenue</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features py-4">
        <div className="container">
          <div className="section-header">
            <h2>Everything You Need to Succeed</h2>
            <p>Powerful tools to create, manage, and optimize your ad campaigns</p>
          </div>

          <div className="grid grid-3">
            <div className="feature-card card card-gradient">
              <div className="feature-icon" style={{ background: 'var(--primary-gradient)' }}>
                <Brain size={28} />
              </div>
              <h3>AI Content Generation</h3>
              <p>
                Generate stunning images, videos, and compelling ad copy using Hugging Face AI,
                Nano Banana, and cutting-edge video generators.
              </p>
              <ul className="feature-list">
                <li><CheckCircle size={16} /> Professional ad images</li>
                <li><CheckCircle size={16} /> Engaging video content</li>
                <li><CheckCircle size={16} /> Conversion-focused copy</li>
              </ul>
            </div>

            <div className="feature-card card card-gradient">
              <div className="feature-icon" style={{ background: 'var(--secondary-gradient)' }}>
                <Target size={28} />
              </div>
              <h3>Multi-Platform Campaigns</h3>
              <p>
                Create and manage campaigns across Meta (Facebook/Instagram), Google Ads,
                and TikTok from a single dashboard.
              </p>
              <ul className="feature-list">
                <li><CheckCircle size={16} /> Unified campaign management</li>
                <li><CheckCircle size={16} /> Cross-platform analytics</li>
                <li><CheckCircle size={16} /> Automated optimization</li>
              </ul>
            </div>

            <div className="feature-card card card-gradient">
              <div className="feature-icon" style={{ background: 'var(--success-gradient)' }}>
                <BarChart3 size={28} />
              </div>
              <h3>ROI Tracking & Analytics</h3>
              <p>
                Real-time performance metrics, ROI calculations, and actionable insights
                to maximize your advertising returns.
              </p>
              <ul className="feature-list">
                <li><CheckCircle size={16} /> Real-time ROI tracking</li>
                <li><CheckCircle size={16} /> Detailed performance reports</li>
                <li><CheckCircle size={16} /> AI-powered recommendations</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="how-it-works py-4">
        <div className="container">
          <div className="section-header">
            <h2>Launch Your Campaign in Minutes</h2>
            <p>Simple, powerful workflow to get your ads live fast</p>
          </div>

          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Connect Your Accounts</h3>
                <p>Link your Meta, Google, and TikTok advertising accounts securely</p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Generate AI Content</h3>
                <p>Let AI create stunning visuals and compelling copy for your campaigns</p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Launch & Optimize</h3>
                <p>Deploy your campaigns and let AI continuously optimize for maximum ROI</p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Track Results</h3>
                <p>Monitor performance in real-time with comprehensive analytics</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section py-4">
        <div className="container">
          <div className="cta-card glass">
            <h2>Ready to Transform Your Marketing?</h2>
            <p>Join thousands of businesses using AI to create better ads and drive more revenue</p>
            <div className="cta-buttons">
              <button className="btn btn-primary btn-large">
                Start Free Trial
                <ArrowRight size={20} />
              </button>
              <button className="btn btn-secondary btn-large">
                Schedule Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <Sparkles size={24} />
              <span>AI Marketing Platform</span>
            </div>
            <div className="footer-links">
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#docs">Documentation</a>
              <a href="#support">Support</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 AI Marketing Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
