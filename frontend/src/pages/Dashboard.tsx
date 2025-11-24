import {
  ArrowUpRight,
  BarChart3,
  DollarSign,
  Eye,
  LayoutDashboard,
  Plus,
  Target,
  TrendingUp,
  Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AICampaignBuilder from '../components/AICampaignBuilder';
import ContentGenerator from '../components/ContentGenerator';
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
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [showContentGenerator, setShowContentGenerator] = useState(false);
  const [showCampaignCreator, setShowCampaignCreator] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch campaigns
      const campaignsRes = await fetch('http://localhost:3000/api/campaigns');
      const campaignsData = await campaignsRes.json();
      setCampaigns(campaignsData.campaigns || []);

      // Fetch analytics
      const analyticsRes = await fetch('http://localhost:3000/api/analytics/overview');
      const analyticsData = await analyticsRes.json();
      setAnalytics(analyticsData);
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
          <span>AI Marketing</span>
        </div>

        <nav className="sidebar-nav">
          <a href="#overview" className="nav-item active">
            <LayoutDashboard size={20} />
            <span>Overview</span>
          </a>
          <a href="#campaigns" className="nav-item">
            <Target size={20} />
            <span>Campaigns</span>
          </a>
          <a href="#analytics" className="nav-item">
            <BarChart3 size={20} />
            <span>Analytics</span>
          </a>
          <a href="#content" className="nav-item">
            <Zap size={20} />
            <span>AI Content</span>
          </a>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">DU</div>
            <div className="user-info">
              <div className="user-name">Demo User</div>
              <div className="user-email">demo@ai.com</div>
            </div>
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
          <button
            className="btn btn-primary"
            onClick={() => setShowCampaignCreator(true)}
          >
            <Plus size={20} />
            New Campaign
          </button>
        </header>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card card-gradient glass">
            <div className="stat-header">
              <span className="stat-label">Total Revenue</span>
              <DollarSign className="stat-icon" style={{ color: '#00f2fe' }} />
            </div>
            <div className="stat-value">${analytics?.totalRevenue.toLocaleString()}</div>
            <div className="stat-change positive">
              <ArrowUpRight size={16} />
              <span>+12.5% from last month</span>
            </div>
          </div>

          <div className="stat-card card-gradient glass">
            <div className="stat-header">
              <span className="stat-label">Average ROI</span>
              <TrendingUp className="stat-icon" style={{ color: '#667eea' }} />
            </div>
            <div className="stat-value">{analytics?.averageROI}%</div>
            <div className="stat-change positive">
              <ArrowUpRight size={16} />
              <span>+8.3% from last month</span>
            </div>
          </div>

          <div className="stat-card card-gradient glass">
            <div className="stat-header">
              <span className="stat-label">Total Impressions</span>
              <Eye className="stat-icon" style={{ color: '#f5576c' }} />
            </div>
            <div className="stat-value">{(analytics?.totalImpressions || 0).toLocaleString()}</div>
            <div className="stat-change positive">
              <ArrowUpRight size={16} />
              <span>+23.1% from last month</span>
            </div>
          </div>

          <div className="stat-card card-gradient glass">
            <div className="stat-header">
              <span className="stat-label">Active Campaigns</span>
              <Target className="stat-icon" style={{ color: '#fee140' }} />
            </div>
            <div className="stat-value">{analytics?.activeCampaigns}</div>
            <div className="stat-change neutral">
              <span>2 pending approval</span>
            </div>
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
              onClick={() => alert('View All Campaigns feature coming soon! This will show all your campaigns.')}
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

        {/* Quick Actions */}
        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <button
              className="action-card card glass"
              onClick={() => setShowCampaignCreator(true)}
            >
              <Plus className="action-icon" />
              <h3>Create Campaign</h3>
              <p>Launch a new ad campaign</p>
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
    </div>
  );
}
