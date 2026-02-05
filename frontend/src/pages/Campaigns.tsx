import {
  ArrowLeft,
  BarChart3,
  Filter,
  LayoutDashboard,
  LayoutGrid,
  List,
  LogOut,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  Target,
  Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AICampaignBuilder from '../components/AICampaignBuilder';
import './Campaigns.css';
import './Dashboard.css'; // Import dashboard styles for sidebar

interface Campaign {
  id: string;
  name: string;
  platform: string;
  status: 'active' | 'paused' | 'draft' | 'completed';
  budget: number;
  objective: string;
  createdAt: string;
  metrics?: {
    spend: number;
    revenue: number;
    impressions: number;
    clicks: number;
    conversions: number;
  };
}

export default function Campaigns() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [showCampaignCreator, setShowCampaignCreator] = useState(false);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchCampaigns();
  }, [isAuthenticated, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns');
      const data = await response.json();
      setCampaigns(data.campaigns);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCampaignCreated = (campaign: Campaign) => {
    setCampaigns(prev => [campaign, ...prev]);
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    const matchesPlatform = platformFilter === 'all' || campaign.platform === platformFilter;
    return matchesSearch && matchesStatus && matchesPlatform;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'paused': return 'status-paused';
      case 'draft': return 'status-draft';
      case 'completed': return 'status-completed';
      default: return '';
    }
  };

  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;

  if (loading) {
    return (
      <div className="campaigns-loading">
        <div className="spinner"></div>
        <p>Loading campaigns...</p>
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
          <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}>
            <LayoutDashboard size={20} />
            <span>Overview</span>
          </a>
          <a href="#" className="nav-item active" onClick={(e) => { e.preventDefault(); navigate('/campaigns'); }}>
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
        <div className="campaigns-page">
          {/* Header */}
          <header className="campaigns-header">
            <div className="header-content">
          <h1>Campaigns</h1>
          <p>Manage and monitor your advertising campaigns</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowCampaignCreator(true)}
        >
          <Plus size={20} />
          New Campaign
        </button>
      </header>

      {/* Filters & Controls */}
      <div className="campaigns-controls glass">
        <div className="search-bar">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filters">
          <div className="filter-group">
            <Filter size={16} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="draft">Draft</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="filter-group">
            <SlidersHorizontal size={16} />
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
            >
              <option value="all">All Platforms</option>
              <option value="meta">Meta</option>
              <option value="google">Google</option>
              <option value="tiktok">TikTok</option>
              <option value="linkedin">LinkedIn</option>
            </select>
          </div>

          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List size={20} />
            </button>
            <button
              className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      {viewMode === 'list' ? (
        <div className="campaigns-table-container glass">
          <table className="campaigns-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Platform</th>
                <th>Budget</th>
                <th>Spend</th>
                <th>Revenue</th>
                <th>ROI</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCampaigns.map((campaign) => {
                const spend = campaign.metrics?.spend || 0;
                const revenue = campaign.metrics?.revenue || 0;
                const roi = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;

                return (
                  <tr key={campaign.id}>
                    <td>
                      <div className="campaign-name-cell">
                        <span className="campaign-name">{campaign.name}</span>
                        <span className="campaign-objective">{campaign.objective}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td>
                      <span className={`platform-badge platform-${campaign.platform}`}>
                        {campaign.platform}
                      </span>
                    </td>
                    <td>{formatCurrency(campaign.budget)}</td>
                    <td>{formatCurrency(spend)}</td>
                    <td>{formatCurrency(revenue)}</td>
                    <td>
                      <span className={`roi-value ${roi >= 0 ? 'positive' : 'negative'}`}>
                        {roi >= 0 ? '+' : ''}{Math.round(roi)}%
                      </span>
                    </td>
                    <td>{new Date(campaign.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="btn-icon">
                        <MoreHorizontal size={20} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="campaigns-grid">
          {filteredCampaigns.map((campaign) => {
            const spend = campaign.metrics?.spend || 0;
            const revenue = campaign.metrics?.revenue || 0;
            const roi = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;

            return (
              <div key={campaign.id} className="campaign-card glass">
                <div className="card-header">
                  <div className="header-top">
                    <span className={`platform-badge platform-${campaign.platform}`}>
                      {campaign.platform}
                    </span>
                    <button className="btn-icon">
                      <MoreHorizontal size={20} />
                    </button>
                  </div>
                  <h3>{campaign.name}</h3>
                  <span className={`status-badge ${getStatusColor(campaign.status)}`}>
                    {campaign.status}
                  </span>
                </div>

                <div className="card-metrics">
                  <div className="metric-item">
                    <span className="label">Budget</span>
                    <span className="value">{formatCurrency(campaign.budget)}</span>
                  </div>
                  <div className="metric-item">
                    <span className="label">Spend</span>
                    <span className="value">{formatCurrency(spend)}</span>
                  </div>
                  <div className="metric-item">
                    <span className="label">ROI</span>
                    <span className={`value ${roi >= 0 ? 'positive' : 'negative'}`}>
                      {roi >= 0 ? '+' : ''}{Math.round(roi)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

        {/* AI Campaign Builder Modal */}
        <AICampaignBuilder
          isOpen={showCampaignCreator}
          onClose={() => setShowCampaignCreator(false)}
          onCampaignCreated={handleCampaignCreated}
        />
      </div>
      </main>
    </div>
  );
}
