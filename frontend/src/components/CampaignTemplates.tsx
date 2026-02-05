import { useState } from 'react';
import { 
  Target, 
  Users, 
  TrendingUp, 
  ShoppingCart, 
  MessageSquare, 
  ArrowRight,
  Sparkles,
  X,
  Star,
  Zap
} from 'lucide-react';
import './CampaignTemplates.css';

interface CampaignTemplate {
  id: string;
  name: string;
  description: string;
  objective: string;
  category: string;
  platform: string[];
  budget: {
    min: number;
    recommended: number;
    max: number;
  };
  duration: string;
  targeting: {
    ageRange: number[];
    interests: string[];
    locations: string[];
    behaviors: string[];
  };
  expectedResults: {
    ctr: number;
    conversionRate: number;
    roi: number;
    timeline: string;
  };
  adCopy: {
    headline: string;
    body: string;
    cta: string;
  };
  icon: string;
  tags: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  popularity: number;
}

interface CampaignTemplatesProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: CampaignTemplate) => void;
}

export default function CampaignTemplates({ isOpen, onClose, onSelectTemplate }: CampaignTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const templates: CampaignTemplate[] = [
    {
      id: 'ecommerce-conversion',
      name: 'E-commerce Conversion Booster',
      description: 'Drive sales with targeted product ads featuring compelling offers and social proof',
      objective: 'conversions',
      category: 'ecommerce',
      platform: ['meta', 'google'],
      budget: { min: 3000, recommended: 5000, max: 15000 },
      duration: '4-6 weeks',
      targeting: {
        ageRange: [25, 45],
        interests: ['online shopping', 'product discovery', 'brand enthusiasts'],
        locations: ['United States', 'Canada', 'United Kingdom'],
        behaviors: ['frequent online shoppers', 'high-value customers']
      },
      expectedResults: {
        ctr: 2.8,
        conversionRate: 4.2,
        roi: 320,
        timeline: '2-3 weeks'
      },
      adCopy: {
        headline: 'Discover Products You\'ll Love - Limited Time Offer!',
        body: 'Join thousands of satisfied customers who found exactly what they were looking for.',
        cta: 'Shop Now - 25% Off'
      },
      icon: '🛍️',
      tags: ['High ROI', 'Proven Results', 'Best Seller'],
      difficulty: 'Beginner',
      popularity: 95
    },
    {
      id: 'lead-gen-b2b',
      name: 'B2B Lead Generation Machine',
      description: 'Generate qualified leads for B2B services with professional targeting and compelling offers',
      objective: 'leads',
      category: 'business',
      platform: ['linkedin', 'google'],
      budget: { min: 4000, recommended: 7000, max: 20000 },
      duration: '6-8 weeks',
      targeting: {
        ageRange: [28, 55],
        interests: ['business development', 'professional services', 'decision makers'],
        locations: ['United States', 'Canada', 'United Kingdom', 'Australia'],
        behaviors: ['business professionals', 'decision makers', 'company executives']
      },
      expectedResults: {
        ctr: 3.5,
        conversionRate: 8.1,
        roi: 450,
        timeline: '3-4 weeks'
      },
      adCopy: {
        headline: 'Transform Your Business Operations Today',
        body: 'Join 1000+ companies that improved efficiency by 40% with our solution.',
        cta: 'Get Free Consultation'
      },
      icon: '🏢',
      tags: ['B2B Expert', 'High Value', 'Professional'],
      difficulty: 'Intermediate',
      popularity: 88
    },
    {
      id: 'brand-awareness-viral',
      name: 'Viral Brand Awareness Campaign',
      description: 'Build massive brand recognition with engaging content designed to go viral',
      objective: 'awareness',
      category: 'brand',
      platform: ['tiktok', 'meta'],
      budget: { min: 2000, recommended: 4000, max: 12000 },
      duration: '3-4 weeks',
      targeting: {
        ageRange: [18, 35],
        interests: ['trending content', 'social media', 'viral videos'],
        locations: ['United States', 'United Kingdom', 'Canada', 'Australia'],
        behaviors: ['social media enthusiasts', 'content creators', 'trend followers']
      },
      expectedResults: {
        ctr: 5.2,
        conversionRate: 2.1,
        roi: 180,
        timeline: '1-2 weeks'
      },
      adCopy: {
        headline: 'The Story Everyone\'s Talking About',
        body: 'Be part of the movement that\'s changing how people think about [your industry].',
        cta: 'Join the Conversation'
      },
      icon: '🚀',
      tags: ['Trending', 'Creative', 'Viral Potential'],
      difficulty: 'Advanced',
      popularity: 76
    },
    {
      id: 'app-install-mobile',
      name: 'Mobile App Install Drive',
      description: 'Maximize app downloads with optimized mobile-first campaigns',
      objective: 'app_installs',
      category: 'mobile',
      platform: ['meta', 'google', 'tiktok'],
      budget: { min: 3500, recommended: 6000, max: 18000 },
      duration: '4-5 weeks',
      targeting: {
        ageRange: [21, 40],
        interests: ['mobile apps', 'technology', 'productivity'],
        locations: ['United States', 'Canada', 'United Kingdom'],
        behaviors: ['mobile app users', 'early adopters', 'tech enthusiasts']
      },
      expectedResults: {
        ctr: 4.1,
        conversionRate: 15.3,
        roi: 280,
        timeline: '2-3 weeks'
      },
      adCopy: {
        headline: 'The App That Changes Everything',
        body: 'Join over 50,000 users who already transformed their daily routine.',
        cta: 'Download Free'
      },
      icon: '📱',
      tags: ['Mobile First', 'High Install Rate', 'User Friendly'],
      difficulty: 'Intermediate',
      popularity: 82
    },
    {
      id: 'local-business-boost',
      name: 'Local Business Visibility Boost',
      description: 'Drive foot traffic and local awareness for brick-and-mortar businesses',
      objective: 'local_awareness',
      category: 'local',
      platform: ['meta', 'google'],
      budget: { min: 1500, recommended: 3000, max: 8000 },
      duration: '4-6 weeks',
      targeting: {
        ageRange: [25, 65],
        interests: ['local businesses', 'community events', 'local shopping'],
        locations: ['Local area within 25 miles'],
        behaviors: ['local shoppers', 'community members', 'frequent local visitors']
      },
      expectedResults: {
        ctr: 3.8,
        conversionRate: 6.5,
        roi: 240,
        timeline: '2-4 weeks'
      },
      adCopy: {
        headline: 'Your Neighborhood\'s Best Kept Secret',
        body: 'Discover why locals choose us for quality service and unbeatable prices.',
        cta: 'Visit Us Today'
      },
      icon: '🏪',
      tags: ['Local Focus', 'Community Driven', 'Affordable'],
      difficulty: 'Beginner',
      popularity: 71
    },
    {
      id: 'retargeting-recovery',
      name: 'Abandoned Cart Recovery Pro',
      description: 'Win back customers who abandoned their carts with personalized retargeting',
      objective: 'retargeting',
      category: 'ecommerce',
      platform: ['meta', 'google'],
      budget: { min: 2000, recommended: 4000, max: 10000 },
      duration: '2-3 weeks',
      targeting: {
        ageRange: [22, 50],
        interests: ['previous website visitors', 'cart abandoners', 'product viewers'],
        locations: ['United States', 'Canada', 'United Kingdom'],
        behaviors: ['abandoned cart', 'product interest', 'price conscious']
      },
      expectedResults: {
        ctr: 6.2,
        conversionRate: 12.8,
        roi: 520,
        timeline: '1-2 weeks'
      },
      adCopy: {
        headline: 'Still Thinking About It? Here\'s 20% Off',
        body: 'Complete your purchase now and save on the items you love.',
        cta: 'Complete Purchase'
      },
      icon: '🛒',
      tags: ['High ROI', 'Quick Results', 'Conversion Pro'],
      difficulty: 'Intermediate',
      popularity: 91
    }
  ];

  const categories = [
    { id: 'all', name: 'All Templates', icon: '🎯' },
    { id: 'ecommerce', name: 'E-commerce', icon: '🛍️' },
    { id: 'business', name: 'B2B', icon: '🏢' },
    { id: 'brand', name: 'Brand', icon: '🚀' },
    { id: 'mobile', name: 'Mobile', icon: '📱' },
    { id: 'local', name: 'Local', icon: '🏪' }
  ];

  const platforms = [
    { id: 'all', name: 'All Platforms' },
    { id: 'meta', name: 'Meta' },
    { id: 'google', name: 'Google' },
    { id: 'tiktok', name: 'TikTok' },
    { id: 'linkedin', name: 'LinkedIn' }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesPlatform = selectedPlatform === 'all' || template.platform.includes(selectedPlatform);
    const matchesSearch = searchTerm === '' || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCategory && matchesPlatform && matchesSearch;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return '#22c55e';
      case 'Intermediate': return '#f59e0b';
      case 'Advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const handleSelectTemplate = (template: CampaignTemplate) => {
    onSelectTemplate(template);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="campaign-templates-modal" onClick={(e) => e.stopPropagation()}>
        <div className="templates-header">
          <div className="header-content">
            <h2>
              <Target className="header-icon" />
              Campaign Templates
            </h2>
            <p>Choose from proven templates to jumpstart your campaigns</p>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="templates-filters">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <label>Category</label>
            <div className="filter-buttons">
              {categories.map(category => (
                <button
                  key={category.id}
                  className={`filter-btn ${selectedCategory === category.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <span className="filter-icon">{category.icon}</span>
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label>Platform</label>
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="platform-select"
            >
              {platforms.map(platform => (
                <option key={platform.id} value={platform.id}>
                  {platform.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="templates-grid">
          {filteredTemplates.map(template => (
            <div key={template.id} className="template-card">
              <div className="template-header">
                <div className="template-icon">{template.icon}</div>
                <div className="template-meta">
                  <div className="template-title">
                    <h3>{template.name}</h3>
                    <div className="template-badges">
                      <span 
                        className="difficulty-badge"
                        style={{ backgroundColor: getDifficultyColor(template.difficulty) }}
                      >
                        {template.difficulty}
                      </span>
                      {template.popularity >= 90 && (
                        <span className="popularity-badge">
                          <Star size={12} />
                          Popular
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="template-description">{template.description}</p>
                </div>
              </div>

              <div className="template-details">
                <div className="detail-row">
                  <div className="detail-item">
                    <span className="detail-label">Budget</span>
                    <span className="detail-value">${template.budget.recommended.toLocaleString()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Duration</span>
                    <span className="detail-value">{template.duration}</span>
                  </div>
                </div>

                <div className="detail-row">
                  <div className="detail-item">
                    <span className="detail-label">Expected ROI</span>
                    <span className="detail-value roi-positive">{template.expectedResults.roi}%</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Timeline</span>
                    <span className="detail-value">{template.expectedResults.timeline}</span>
                  </div>
                </div>

                <div className="platform-support">
                  <span className="detail-label">Platforms:</span>
                  <div className="platform-badges">
                    {template.platform.map(platform => (
                      <span key={platform} className={`platform-badge platform-${platform}`}>
                        {platform}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="template-tags">
                  {template.tags.map(tag => (
                    <span key={tag} className="tag-badge">{tag}</span>
                  ))}
                </div>
              </div>

              <div className="template-preview">
                <div className="preview-section">
                  <h4>Sample Ad Copy</h4>
                  <div className="copy-preview">
                    <div className="copy-item">
                      <strong>Headline:</strong> {template.adCopy.headline}
                    </div>
                    <div className="copy-item">
                      <strong>Body:</strong> {template.adCopy.body}
                    </div>
                    <div className="copy-item">
                      <strong>CTA:</strong> {template.adCopy.cta}
                    </div>
                  </div>
                </div>
              </div>

              <div className="template-actions">
                <button
                  className="btn btn-primary template-select-btn"
                  onClick={() => handleSelectTemplate(template)}
                >
                  <Sparkles size={16} />
                  Use This Template
                  <ArrowRight size={16} />
                </button>
                <div className="template-metrics">
                  <span className="metric">
                    <TrendingUp size={14} />
                    {template.expectedResults.ctr}% CTR
                  </span>
                  <span className="metric">
                    <Target size={14} />
                    {template.expectedResults.conversionRate}% CR
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="no-templates">
            <Zap size={48} className="no-templates-icon" />
            <h3>No templates found</h3>
            <p>Try adjusting your filters or search terms</p>
          </div>
        )}

        <div className="templates-footer">
          <div className="footer-stats">
            <span>{filteredTemplates.length} templates available</span>
            <span>•</span>
            <span>Powered by AI optimization</span>
          </div>
        </div>
      </div>
    </div>
  );
}