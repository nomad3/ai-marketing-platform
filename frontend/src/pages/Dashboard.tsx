import {
  BarChart3,
  DollarSign,
  Eye,
  GitBranch,
  LayoutDashboard,
  LogOut,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AICampaignBuilder from '../components/AICampaignBuilder';
import ContentGenerator from '../components/ContentGenerator';
import CampaignTemplates from '../components/CampaignTemplates';
import ThemeToggle from '../components/ThemeToggle';
import './Dashboard.css';

interface Campaign {
  id: string;
  name: string;
  platform: string;
  status: string;
  budget: number;
  spend?: number;
  roi?: number;
}

interface AnalyticsOverview {
  totalSpend: number;
  totalRevenue: number;
  averageROI: number;
  averageROAS: number;
  activeCampaigns: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [showContentGenerator, setShowContentGenerator] = useState(false);
  const [showCampaignCreator, setShowCampaignCreator] = useState(false);
  const [showCampaignTemplates, setShowCampaignTemplates] = useState(false);
  const [pipelineStats, setPipelineStats] = useState<any>(null);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchDashboardData();
  }, [isAuthenticated, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch campaigns
      const campaignsRes = await fetch('/api/campaigns');
      const campaignsData = await campaignsRes.json();
      setCampaigns(campaignsData.campaigns || []);

      // Fetch analytics
      const analyticsRes = await fetch('/api/analytics/overview');
      const analyticsData = await analyticsRes.json();
      setAnalytics(analyticsData);

      // Fetch pipeline stats
      try {
        const pipelineRes = await fetch('/api/analytics/pipeline');
        const pipelineData = await pipelineRes.json();
        setPipelineStats(pipelineData);
      } catch (e) {
        console.error('Failed to fetch pipeline stats:', e);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCampaignCreated = (campaign: Campaign) => {
    setCampaigns(prev => [campaign, ...prev]);
    fetchDashboardData(); // Refresh analytics
  };

  const handleTemplateSelected = (template: any) => {
    // Create a new campaign from template
    const newCampaign = {
      id: `camp_${Date.now()}`,
      name: template.name,
      platform: template.platform[0], // Use first platform
      status: 'draft',
      budget: template.budget.recommended,
      spend: 0,
      roi: 0,
      createdAt: new Date().toISOString(),
      templateId: template.id,
      objective: template.objective,
      targeting: template.targeting
    };
    
    setCampaigns(prev => [newCampaign, ...prev]);
    fetchDashboardData(); // Refresh analytics
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="dashboard-sidebar glass">
        <div className="sidebar-header">
          <Zap className="sidebar-logo" />
          <span>HCA Deal Intel</span>
        </div>

        <nav className="sidebar-nav">
          <a href="#" className="nav-item active" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}>
            <LayoutDashboard size={20} />
            <span>Overview</span>
          </a>
          <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate('/campaigns'); }}>
            <Target size={20} />
            <span>Campaigns</span>
          </a>
          <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate('/analytics'); }}>
            <BarChart3 size={20} />
            <span>Analytics</span>
          </a>
          <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate('/content'); }}>
            <Zap size={20} />
            <span>AI Content</span>
          </a>

          <div style={{ padding: '1rem 1rem 0.5rem', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', fontWeight: 600 }}>
            Deal Intelligence
          </div>
          <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate('/prospects'); }}>
            <Users size={20} />
            <span>Prospects</span>
          </a>
          <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate('/pipeline'); }}>
            <GitBranch size={20} />
            <span>Pipeline</span>
          </a>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
            </div>
            <div className="user-info">
              <div className="user-name">{user?.name || 'User'}</div>
              <div className="user-email">{user?.email || ''}</div>
            </div>
            <ThemeToggle />
            <button
              className="logout-btn"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Header */}
        <header className="dashboard-header">
          <div>
            <h1>Dashboard Overview</h1>
            <p>Monitor your campaigns and performance metrics</p>
          </div>
        </header>

        {/* Quick Actions */}
        <div className="quick-actions">
          <div className="actions-grid">
            <button
              className="action-card card glass"
              onClick={() => setShowCampaignCreator(true)}
            >
              <Plus className="action-icon" />
              <h3>Create Campaign</h3>
              <p>AI-powered campaign builder</p>
            </button>

            <button
              className="action-card card glass"
              onClick={() => setShowCampaignTemplates(true)}
            >
              <Target className="action-icon" />
              <h3>Use Template</h3>
              <p>Start with proven templates</p>
            </button>

            <button className="action-card card glass" onClick={() => setShowContentGenerator(true)}>
              <Zap className="action-icon" />
              <h3>Generate Content</h3>
              <p>Create AI-powered ads</p>
            </button>

            <button
              className="action-card card glass"
              onClick={() => navigate('/analytics')}
            >
              <BarChart3 className="action-icon" />
              <h3>View Analytics</h3>
              <p>Detailed performance reports</p>
            </button>

            <button
              className="action-card card glass"
              onClick={() => alert('Optimization feature coming soon! This will provide AI-powered campaign recommendations.')}
            >
              <TrendingUp className="action-icon" />
              <h3>Optimize Campaigns</h3>
              <p>AI-powered recommendations</p>
            </button>
          </div>
        </div>

        {/* Deal Intelligence Card */}
        {pipelineStats && (
          <div className="deal-intel-section">
            <h2><Sparkles size={20} style={{ color: 'var(--primary)' }} /> Deal Intelligence</h2>
            <div className="stats-grid">
              <div className="stat-card card-gradient glass" onClick={() => navigate('/prospects')} style={{ cursor: 'pointer' }}>
                <div className="stat-header">
                  <span className="stat-label">Total Prospects</span>
                  <Users className="stat-icon" style={{ color: '#667eea' }} />
                </div>
                <div className="stat-value">{pipelineStats.total_prospects}</div>
                <div className="stat-change neutral"><span>In pipeline</span></div>
              </div>

              <div className="stat-card card-gradient glass" onClick={() => navigate('/prospects?score_min=70')} style={{ cursor: 'pointer' }}>
                <div className="stat-header">
                  <span className="stat-label">Hot Prospects</span>
                  <TrendingUp className="stat-icon" style={{ color: '#00f2fe' }} />
                </div>
                <div className="stat-value">{pipelineStats.hot_prospects}</div>
                <div className="stat-change positive"><span>Score 70+</span></div>
              </div>

              <div className="stat-card card-gradient glass" onClick={() => navigate('/pipeline')} style={{ cursor: 'pointer' }}>
                <div className="stat-header">
                  <span className="stat-label">Active Deals</span>
                  <Target className="stat-icon" style={{ color: '#fee140' }} />
                </div>
                <div className="stat-value">{pipelineStats.active_deals}</div>
                <div className="stat-change neutral"><span>In negotiation</span></div>
              </div>

              <div className="stat-card card-gradient glass">
                <div className="stat-header">
                  <span className="stat-label">Signals (7d)</span>
                  <Sparkles className="stat-icon" style={{ color: '#f093fb' }} />
                </div>
                <div className="stat-value">{pipelineStats.recent_signals}</div>
                <div className="stat-change neutral"><span>Recently detected</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card card-gradient glass">
            <div className="stat-header">
              <span className="stat-label">Total Revenue</span>
              <DollarSign className="stat-icon" style={{ color: '#00f2fe' }} />
            </div>
            <div className="stat-value">${analytics?.totalRevenue.toLocaleString()}</div>
          </div>

          <div className="stat-card card-gradient glass">
            <div className="stat-header">
              <span className="stat-label">Average ROI</span>
              <TrendingUp className="stat-icon" style={{ color: '#667eea' }} />
            </div>
            <div className="stat-value">{analytics?.averageROI}%</div>
          </div>

          <div className="stat-card card-gradient glass">
            <div className="stat-header">
              <span className="stat-label">Total Impressions</span>
              <Eye className="stat-icon" style={{ color: '#f5576c' }} />
            </div>
            <div className="stat-value">{(analytics?.totalImpressions || 0).toLocaleString()}</div>
          </div>

          <div className="stat-card card-gradient glass">
            <div className="stat-header">
              <span className="stat-label">Active Campaigns</span>
              <Target className="stat-icon" style={{ color: '#fee140' }} />
            </div>
            <div className="stat-value">{analytics?.activeCampaigns}</div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="metrics-section">
          <h2>Performance Metrics</h2>
          <div className="metrics-grid">
            <div className="metric-card card glass">
              <div className="metric-label">Total Clicks</div>
              <div className="metric-value">{analytics?.totalClicks.toLocaleString()}</div>
              <div className="metric-bar">
                <div className="metric-bar-fill" style={{ width: '75%', background: 'var(--primary-gradient)' }}></div>
              </div>
            </div>

            <div className="metric-card card glass">
              <div className="metric-label">Conversions</div>
              <div className="metric-value">{analytics?.totalConversions}</div>
              <div className="metric-bar">
                <div className="metric-bar-fill" style={{ width: '60%', background: 'var(--success-gradient)' }}></div>
              </div>
            </div>

            <div className="metric-card card glass">
              <div className="metric-label">ROAS</div>
              <div className="metric-value">{analytics?.averageROAS}x</div>
              <div className="metric-bar">
                <div className="metric-bar-fill" style={{ width: '85%', background: 'var(--secondary-gradient)' }}></div>
              </div>
            </div>

            <div className="metric-card card glass">
              <div className="metric-label">Ad Spend</div>
              <div className="metric-value">${analytics?.totalSpend.toLocaleString()}</div>
              <div className="metric-bar">
                <div className="metric-bar-fill" style={{ width: '50%', background: 'var(--accent-gradient)' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Campaigns Table */}
        <div className="campaigns-section">
          <div className="section-header-row">
            <h2>Active Campaigns</h2>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/campaigns')}
            >
              View All
            </button>
          </div>

          <div className="campaigns-table card glass">
            <table>
              <thead>
                <tr>
                  <th>Campaign Name</th>
                  <th>Platform</th>
                  <th>Status</th>
                  <th>Budget</th>
                  <th>Spend</th>
                  <th>ROI</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id}>
                    <td className="campaign-name">
                      <div className="campaign-icon">
                        <Target size={16} />
                      </div>
                      {campaign.name}
                    </td>
                    <td>
                      <span className={`platform-badge platform-${campaign.platform}`}>
                        {campaign.platform}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-${campaign.status}`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td>${campaign.budget.toLocaleString()}</td>
                    <td>${(campaign.spend || 0).toLocaleString()}</td>
                    <td>
                      <span className="roi-value positive">
                        {campaign.roi || 0}%
                      </span>
                    </td>
                    <td>
                      <button className="btn-icon">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>


      </main>

      {/* Content Generator Modal */}
      <ContentGenerator
        isOpen={showContentGenerator}
        onClose={() => setShowContentGenerator(false)}
      />

      {/* AI Campaign Builder Modal */}
      <AICampaignBuilder
        isOpen={showCampaignCreator}
        onClose={() => setShowCampaignCreator(false)}
        onCampaignCreated={handleCampaignCreated}
      />

      {/* Campaign Templates Modal */}
      <CampaignTemplates
        isOpen={showCampaignTemplates}
        onClose={() => setShowCampaignTemplates(false)}
        onSelectTemplate={handleTemplateSelected}
      />
    </div>
  );
}
