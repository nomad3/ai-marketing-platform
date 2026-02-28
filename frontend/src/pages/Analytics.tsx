import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  DollarSign,
  Download,
  Eye,
  GitBranch,
  LayoutDashboard,
  LogOut,
  MousePointer,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Target,
  Users,
  Zap,
  Filter,
  Share2
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css'; // Import dashboard styles for sidebar
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Legend
} from 'recharts';
import './Analytics.css';

interface AnalyticsData {
  totalSpend: number;
  totalRevenue: number;
  averageROI: number;
  averageROAS: number;
  activeCampaigns: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  ctr: number;
  conversionRate: number;
  costPerClick: number;
  costPerConversion: number;
  // Enhanced metrics
  adFrequency: number;
  qualityScore: number;
  lifetimeValue: number;
  attributionRevenue: number;
  crossDeviceConversions: number;
  viewThroughConversions: number;
}

interface CampaignPerformance {
  id: string;
  name: string;
  platform: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  roi: number;
  // Enhanced campaign metrics
  ctr: number;
  conversionRate: number;
  costPerClick: number;
  costPerConversion: number;
  qualityScore: number;
  adFrequency: number;
  reachPercentage: number;
  abTestStatus?: 'winner' | 'challenger' | 'testing' | 'none';
  abTestLift?: number;
}

interface TimeSeriesData {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  roi: number;
  ctr: number;
  conversionRate: number;
}

interface PlatformPerformance {
  platform: string;
  spend: number;
  revenue: number;
  roi: number;
  campaigns: number;
  color: string;
}

export default function Analytics() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignPerformance[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [platformData, setPlatformData] = useState<PlatformPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedChart, setSelectedChart] = useState<'revenue' | 'roi' | 'performance' | 'conversions' | 'pipeline'>('revenue');
  const [_selectedPlatforms, _setSelectedPlatforms] = useState<string[]>([]);
  const [showABTests, setShowABTests] = useState(false);
  const [pipelineData, setPipelineData] = useState<any>(null);
  const [signalData, setSignalData] = useState<any>(null);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchAnalytics();
  }, [timeRange, isAuthenticated, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch overview analytics
      const response = await fetch(`/api/analytics/overview?range=${timeRange}`);
      const data = await response.json();
      setAnalytics(data);

      // Fetch campaign performance
      const campaignsResponse = await fetch(`/api/analytics/campaigns?range=${timeRange}`);
      const campaignsData = await campaignsResponse.json();
      setCampaigns(campaignsData.campaigns || []);

      // Fetch time series performance data
      try {
        const timeSeriesRes = await fetch(`/api/analytics/performance-over-time?range=${timeRange}`);
        if (timeSeriesRes.ok) {
          const tsData = await timeSeriesRes.json();
          setTimeSeriesData(Array.isArray(tsData) ? tsData : tsData.data || []);
        } else {
          setTimeSeriesData([]);
        }
      } catch (e) {
        console.error('Performance over time data unavailable:', e);
        setTimeSeriesData([]);
      }

      // Fetch platform performance data
      try {
        const platformRes = await fetch(`/api/analytics/platform-performance?range=${timeRange}`);
        if (platformRes.ok) {
          const pData = await platformRes.json();
          setPlatformData(Array.isArray(pData) ? pData : pData.platforms || []);
        } else {
          setPlatformData([]);
        }
      } catch (e) {
        console.error('Platform performance data unavailable:', e);
        setPlatformData([]);
      }

      // Fetch pipeline analytics
      try {
        const pipelineRes = await fetch('/api/analytics/pipeline');
        const pData = await pipelineRes.json();
        setPipelineData(pData);
      } catch (e) { console.error('Pipeline analytics unavailable:', e); }

      // Fetch signal analytics
      try {
        const signalRes = await fetch('/api/analytics/signals');
        const sData = await signalRes.json();
        setSignalData(sData);
      } catch (e) { console.error('Signal analytics unavailable:', e); }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;
  const formatNumber = (value: number) => value.toLocaleString();
  const formatPercent = (value: number) => `${value.toFixed(2)}%`;
  
  // Custom tooltip component for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip glass">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.name.includes('$') || entry.dataKey.includes('revenue') || entry.dataKey.includes('spend') 
                ? formatCurrency(entry.value) 
                : entry.name.includes('%') || entry.dataKey.includes('Rate') || entry.dataKey.includes('roi')
                ? formatPercent(entry.value)
                : formatNumber(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Export report function
  const exportReport = () => {
    const reportData = {
      timeRange,
      analytics,
      campaigns,
      platformData,
      generatedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `marketing-analytics-report-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="dashboard-sidebar glass">
        <div className="sidebar-header">
          <Zap className="sidebar-logo" />
          <span>HCA Deal Intel</span>
        </div>

        <nav className="sidebar-nav">
          <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}>
            <LayoutDashboard size={20} />
            <span>Overview</span>
          </a>
          <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate('/campaigns'); }}>
            <Target size={20} />
            <span>Campaigns</span>
          </a>
          <a href="#" className="nav-item active" onClick={(e) => { e.preventDefault(); navigate('/analytics'); }}>
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
        <div className="analytics-page">
          {/* Header */}
          <header className="analytics-header">
            <div>
          <h1>Analytics Dashboard</h1>
          <p>Comprehensive performance insights across all campaigns</p>
        </div>
        <div className="header-actions">
          <select
            className="time-range-select"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          <button className="btn btn-secondary" onClick={() => setShowABTests(!showABTests)}>
            <Target size={20} />
            A/B Tests
          </button>
          <button className="btn btn-primary" onClick={exportReport}>
            <Download size={20} />
            Export Report
          </button>
        </div>
      </header>

      {/* Key Metrics */}
      <div className="metrics-overview">
        <div className="metric-card glass">
          <div className="metric-header">
            <span className="metric-label">Total Revenue</span>
            <DollarSign className="metric-icon" style={{ color: '#00f2fe' }} />
          </div>
          <div className="metric-value">{formatCurrency(analytics?.totalRevenue || 0)}</div>
          <div className="metric-change positive">
            <ArrowUpRight size={16} />
            <span>+15.3% vs previous period</span>
          </div>
        </div>

        <div className="metric-card glass">
          <div className="metric-header">
            <span className="metric-label">Total Spend</span>
            <DollarSign className="metric-icon" style={{ color: '#f5576c' }} />
          </div>
          <div className="metric-value">{formatCurrency(analytics?.totalSpend || 0)}</div>
          <div className="metric-change positive">
            <ArrowDownRight size={16} />
            <span>-5.2% vs previous period</span>
          </div>
        </div>

        <div className="metric-card glass">
          <div className="metric-header">
            <span className="metric-label">Average ROI</span>
            <TrendingUp className="metric-icon" style={{ color: '#667eea' }} />
          </div>
          <div className="metric-value">{analytics?.averageROI || 0}%</div>
          <div className="metric-change positive">
            <ArrowUpRight size={16} />
            <span>+8.7% vs previous period</span>
          </div>
        </div>

        <div className="metric-card glass">
          <div className="metric-header">
            <span className="metric-label">ROAS</span>
            <BarChart3 className="metric-icon" style={{ color: '#fee140' }} />
          </div>
          <div className="metric-value">{analytics?.averageROAS || 0}x</div>
          <div className="metric-change positive">
            <ArrowUpRight size={16} />
            <span>+12.1% vs previous period</span>
          </div>
        </div>
        
        <div className="metric-card glass">
          <div className="metric-header">
            <span className="metric-label">Quality Score</span>
            <Target className="metric-icon" style={{ color: '#4ecdc4' }} />
          </div>
          <div className="metric-value">{analytics?.qualityScore || 8.5}/10</div>
          <div className="metric-change positive">
            <ArrowUpRight size={16} />
            <span>+0.3 vs previous period</span>
          </div>
        </div>

        <div className="metric-card glass">
          <div className="metric-header">
            <span className="metric-label">Customer LTV</span>
            <Users className="metric-icon" style={{ color: '#ff6b6b' }} />
          </div>
          <div className="metric-value">{formatCurrency(analytics?.lifetimeValue || 285)}</div>
          <div className="metric-change positive">
            <ArrowUpRight size={16} />
            <span>+7.2% vs previous period</span>
          </div>
        </div>
      </div>

      {/* Chart Controls */}
      <div className="chart-controls glass">
        <div className="chart-tabs">
          <button 
            className={`tab ${selectedChart === 'revenue' ? 'active' : ''}`}
            onClick={() => setSelectedChart('revenue')}
          >
            Revenue Trend
          </button>
          <button 
            className={`tab ${selectedChart === 'roi' ? 'active' : ''}`}
            onClick={() => setSelectedChart('roi')}
          >
            ROI Analysis
          </button>
          <button 
            className={`tab ${selectedChart === 'performance' ? 'active' : ''}`}
            onClick={() => setSelectedChart('performance')}
          >
            Performance Metrics
          </button>
          <button
            className={`tab ${selectedChart === 'conversions' ? 'active' : ''}`}
            onClick={() => setSelectedChart('conversions')}
          >
            Conversion Funnel
          </button>
          <button
            className={`tab ${selectedChart === 'pipeline' ? 'active' : ''}`}
            onClick={() => setSelectedChart('pipeline')}
          >
            <Sparkles size={14} style={{ marginRight: 4 }} />
            Pipeline
          </button>
        </div>
        <div className="chart-filters">
          <button className="btn btn-secondary">
            <Filter size={16} />
            Filters
          </button>
          <button className="btn btn-secondary">
            <Share2 size={16} />
            Share
          </button>
        </div>
      </div>

      {/* Main Chart Section */}
      <div className="main-chart-section glass">
        {selectedChart === 'revenue' && (
          <div className="chart-container">
            <h3>Revenue & Spend Trend</h3>
            {timeSeriesData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
                <BarChart3 size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                <p>No performance data available for this time range.</p>
              </div>
            ) : (
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  fill="url(#revenueGradient)" 
                  stroke="#00f2fe" 
                  strokeWidth={2}
                  name="Revenue"
                />
                <Line 
                  type="monotone" 
                  dataKey="spend" 
                  stroke="#f5576c" 
                  strokeWidth={3}
                  name="Spend"
                />
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#00f2fe" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
              </ComposedChart>
            </ResponsiveContainer>
            )}
          </div>
        )}

        {selectedChart === 'roi' && (
          <div className="chart-container">
            <h3>ROI Performance Analysis</h3>
            {timeSeriesData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
                <BarChart3 size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                <p>No performance data available for this time range.</p>
              </div>
            ) : (
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="roi" 
                  fill="url(#roiGradient)" 
                  stroke="#667eea" 
                  strokeWidth={2}
                  name="ROI %"
                />
                <defs>
                  <linearGradient id="roiGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#667eea" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#667eea" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
            )}
          </div>
        )}

        {selectedChart === 'performance' && (
          <div className="chart-container">
            <h3>Performance Metrics Over Time</h3>
            {timeSeriesData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
                <BarChart3 size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                <p>No performance data available for this time range.</p>
              </div>
            ) : (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="ctr"
                  stroke="#4ecdc4"
                  strokeWidth={2}
                  name="CTR %"
                />
                <Line
                  type="monotone"
                  dataKey="conversionRate"
                  stroke="#ff6b6b"
                  strokeWidth={2}
                  name="Conversion Rate %"
                />
              </LineChart>
            </ResponsiveContainer>
            )}
          </div>
        )}

        {selectedChart === 'conversions' && (
          <div className="chart-container">
            <h3>Conversion Funnel Analysis</h3>
            {timeSeriesData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
                <BarChart3 size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                <p>No performance data available for this time range.</p>
              </div>
            ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={timeSeriesData.slice(-7)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar
                  dataKey="impressions"
                  fill="#667eea"
                  name="Impressions"
                  opacity={0.7}
                />
                <Bar
                  dataKey="clicks"
                  fill="#4ecdc4"
                  name="Clicks"
                  opacity={0.8}
                />
                <Bar
                  dataKey="conversions"
                  fill="#ff6b6b"
                  name="Conversions"
                  opacity={0.9}
                />
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
        )}

        {selectedChart === 'pipeline' && (
          <div className="chart-container">
            <h3>Deal Pipeline Analytics</h3>
            {pipelineData ? (
              <div className="pipeline-analytics-grid">
                {/* Funnel by Stage */}
                <div className="pipeline-chart-half">
                  <h4>Prospects by Stage</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={
                      pipelineData.stages
                        ? pipelineData.stages.map((s: any) => ({ name: s.stage.replace('_', ' '), count: parseInt(s.count) }))
                        : [
                            { name: 'Lead', count: pipelineData.stage_lead || 0 },
                            { name: 'Contacted', count: pipelineData.stage_contacted || 0 },
                            { name: 'Engaged', count: pipelineData.stage_engaged || 0 },
                            { name: 'Active Deal', count: pipelineData.stage_active_deal || 0 },
                            { name: 'Closed Won', count: pipelineData.stage_closed_won || 0 },
                            { name: 'Closed Lost', count: pipelineData.stage_closed_lost || 0 },
                          ]
                    }>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="name" stroke="#888" fontSize={12} />
                      <YAxis stroke="#888" />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Prospects" radius={[4, 4, 0, 0]}>
                        {['#b8c1ec', '#667eea', '#00f2fe', '#fee140', '#48c78e', '#f5576c'].map((color, i) => (
                          <Cell key={i} fill={color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Industry Breakdown */}
                <div className="pipeline-chart-half">
                  <h4>Industry Distribution</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={
                          signalData?.industry_breakdown
                            ? signalData.industry_breakdown.map((ind: any) => ({
                                name: ind.industry.replace('_', ' '),
                                value: parseInt(ind.count),
                              }))
                            : [
                                { name: 'Healthcare', value: 3 },
                                { name: 'Consumer', value: 2 },
                                { name: 'Industrial', value: 2 },
                                { name: 'Business Services', value: 3 },
                              ]
                        }
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, value }) => `${name}: ${value}`}
                        dataKey="value"
                      >
                        {['#00f2fe', '#f093fb', '#fee140', '#667eea'].map((color, i) => (
                          <Cell key={i} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Summary Cards */}
                <div className="pipeline-summary-row">
                  <div className="pipeline-metric glass">
                    <span className="pipeline-metric-label">Total Prospects</span>
                    <span className="pipeline-metric-value" style={{ color: '#667eea' }}>{pipelineData.total_prospects || 0}</span>
                  </div>
                  <div className="pipeline-metric glass">
                    <span className="pipeline-metric-label">Hot Prospects (70+)</span>
                    <span className="pipeline-metric-value" style={{ color: '#00f2fe' }}>{pipelineData.hot_prospects || 0}</span>
                  </div>
                  <div className="pipeline-metric glass">
                    <span className="pipeline-metric-label">Active Deals</span>
                    <span className="pipeline-metric-value" style={{ color: '#fee140' }}>{pipelineData.active_deals || 0}</span>
                  </div>
                  <div className="pipeline-metric glass">
                    <span className="pipeline-metric-label">Avg Score</span>
                    <span className="pipeline-metric-value" style={{ color: '#48c78e' }}>{pipelineData.avg_score ? Math.round(pipelineData.avg_score) : 0}</span>
                  </div>
                  <div className="pipeline-metric glass">
                    <span className="pipeline-metric-label">Recent Signals (7d)</span>
                    <span className="pipeline-metric-value" style={{ color: '#f093fb' }}>{pipelineData.recent_signals || 0}</span>
                  </div>
                </div>

                {/* Top Signals Table */}
                {signalData?.top_signals && signalData.top_signals.length > 0 && (
                  <div className="signal-table-section">
                    <h4>Top Scoring Signals</h4>
                    <table className="signal-table">
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Type</th>
                          <th>Avg Strength</th>
                          <th>Occurrences</th>
                        </tr>
                      </thead>
                      <tbody>
                        {signalData.top_signals.slice(0, 8).map((sig: any, i: number) => (
                          <tr key={i}>
                            <td><span className="signal-category-badge">{sig.signal_category.replace('_', ' ')}</span></td>
                            <td>{sig.signal_type.replace(/_/g, ' ')}</td>
                            <td><span className="signal-strength">{parseFloat(sig.avg_strength).toFixed(1)}</span></td>
                            <td>{sig.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <Sparkles size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                <p>No pipeline data available yet. Add prospects to see analytics.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Platform Performance */}
      <div className="platform-performance-section">
        <h2>Platform Performance Comparison</h2>
        {platformData.length === 0 ? (
          <div className="glass" style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-muted)' }}>
            <BarChart3 size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <p>No platform performance data available for this time range.</p>
          </div>
        ) : (
        <div className="platform-charts">
          <div className="platform-chart glass">
            <h3>Revenue by Platform</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="revenue"
                  label={({ platform, revenue }) => `${platform}: ${formatCurrency(revenue)}`}
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="platform-chart glass">
            <h3>ROI Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={platformData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="platform" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="roi"
                  name="ROI %"
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        )}
      </div>

      {/* A/B Test Results */}
      {showABTests && (
        <div className="ab-test-section">
          <h2>A/B Test Results</h2>
          <div className="glass" style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-muted)' }}>
            <Target size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <p>No A/B tests configured yet. Create an A/B test from the Campaigns page to see results here.</p>
          </div>
        </div>
      )}

      {/* Enhanced Performance Metrics */}
      <div className="performance-section">
        <h2>Detailed Performance Metrics</h2>
        <div className="performance-grid">
          <div className="performance-card glass">
            <Eye className="performance-icon" />
            <div className="performance-label">Total Impressions</div>
            <div className="performance-value">{formatNumber(analytics?.totalImpressions || 0)}</div>
            <div className="performance-trend positive">+12.3%</div>
          </div>

          <div className="performance-card glass">
            <MousePointer className="performance-icon" />
            <div className="performance-label">Total Clicks</div>
            <div className="performance-value">{formatNumber(analytics?.totalClicks || 0)}</div>
            <div className="performance-trend positive">+8.7%</div>
          </div>

          <div className="performance-card glass">
            <ShoppingCart className="performance-icon" />
            <div className="performance-label">Total Conversions</div>
            <div className="performance-value">{formatNumber(analytics?.totalConversions || 0)}</div>
            <div className="performance-trend positive">+15.2%</div>
          </div>

          <div className="performance-card glass">
            <TrendingUp className="performance-icon" />
            <div className="performance-label">CTR</div>
            <div className="performance-value">{formatPercent(analytics?.ctr || 0)}</div>
            <div className="performance-trend positive">+0.3%</div>
          </div>

          <div className="performance-card glass">
            <BarChart3 className="performance-icon" />
            <div className="performance-label">Conversion Rate</div>
            <div className="performance-value">{formatPercent(analytics?.conversionRate || 0)}</div>
            <div className="performance-trend positive">+1.1%</div>
          </div>

          <div className="performance-card glass">
            <DollarSign className="performance-icon" />
            <div className="performance-label">Cost Per Click</div>
            <div className="performance-value">{formatCurrency(analytics?.costPerClick || 0)}</div>
            <div className="performance-trend negative">+$0.12</div>
          </div>

          <div className="performance-card glass">
            <DollarSign className="performance-icon" />
            <div className="performance-label">Cost Per Conversion</div>
            <div className="performance-value">{formatCurrency(analytics?.costPerConversion || 0)}</div>
            <div className="performance-trend positive">-$2.45</div>
          </div>

          <div className="performance-card glass">
            <Target className="performance-icon" />
            <div className="performance-label">Ad Frequency</div>
            <div className="performance-value">{analytics?.adFrequency || 2.3}</div>
            <div className="performance-trend neutral">Optimal</div>
          </div>

          <div className="performance-card glass">
            <Zap className="performance-icon" />
            <div className="performance-label">View-Through Conversions</div>
            <div className="performance-value">{formatNumber(analytics?.viewThroughConversions || 145)}</div>
            <div className="performance-trend positive">+22.1%</div>
          </div>

          <div className="performance-card glass">
            <Users className="performance-icon" />
            <div className="performance-label">Cross-Device Conversions</div>
            <div className="performance-value">{formatNumber(analytics?.crossDeviceConversions || 89)}</div>
            <div className="performance-trend positive">+18.5%</div>
          </div>

          <div className="performance-card glass">
            <Calendar className="performance-icon" />
            <div className="performance-label">Active Campaigns</div>
            <div className="performance-value">{analytics?.activeCampaigns || 0}</div>
            <div className="performance-trend neutral">2 pending</div>
          </div>

          <div className="performance-card glass">
            <TrendingUp className="performance-icon" />
            <div className="performance-label">Attribution Revenue</div>
            <div className="performance-value">{formatCurrency(analytics?.attributionRevenue || 12500)}</div>
            <div className="performance-trend positive">+9.8%</div>
          </div>
        </div>
      </div>

      {/* Enhanced Campaign Performance Table */}
      <div className="campaigns-performance">
        <div className="section-header">
          <h2>Campaign Performance Breakdown</h2>
          <div className="table-actions">
            <select className="platform-filter">
              <option value="">All Platforms</option>
              <option value="meta">Meta</option>
              <option value="google">Google</option>
              <option value="tiktok">TikTok</option>
              <option value="linkedin">LinkedIn</option>
            </select>
            <button className="btn btn-secondary">
              <Download size={16} />
              Export Table
            </button>
          </div>
        </div>
        
        <div className="table-container glass">
          <table>
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Platform</th>
                <th>Status</th>
                <th>Impressions</th>
                <th>Clicks</th>
                <th>CTR</th>
                <th>Conversions</th>
                <th>Conv. Rate</th>
                <th>CPC</th>
                <th>Spend</th>
                <th>Revenue</th>
                <th>ROI</th>
                <th>A/B Test</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id}>
                  <td className="campaign-name">{campaign.name}</td>
                  <td>
                    <span className={`platform-badge platform-${campaign.platform}`}>
                      {campaign.platform}
                    </span>
                  </td>
                  <td>
                    <span className="status-badge status-active">Active</span>
                  </td>
                  <td>{formatNumber(campaign.impressions)}</td>
                  <td>{formatNumber(campaign.clicks)}</td>
                  <td>{formatPercent(campaign.ctr || 2.5)}</td>
                  <td>{formatNumber(campaign.conversions)}</td>
                  <td>{formatPercent(campaign.conversionRate || 3.2)}</td>
                  <td>{formatCurrency(campaign.costPerClick || 2.15)}</td>
                  <td>{formatCurrency(campaign.spend)}</td>
                  <td>{formatCurrency(campaign.revenue)}</td>
                  <td>
                    <span className={`roi-badge ${campaign.roi >= 0 ? 'positive' : 'negative'}`}>
                      {campaign.roi >= 0 ? '+' : ''}{campaign.roi}%
                    </span>
                  </td>
                  <td>
                    {campaign.abTestStatus && campaign.abTestStatus !== 'none' && (
                      <span className={`ab-test-badge ${campaign.abTestStatus === 'winner' ? 'winner' : 'testing'}`}>
                        {campaign.abTestStatus === 'winner' && campaign.abTestLift 
                          ? `🏆 +${campaign.abTestLift}%` 
                          : campaign.abTestStatus === 'testing' 
                          ? '🧪 Testing' 
                          : '📊 Challenger'}
                      </span>
                    )}
                  </td>
                  <td>
                    <button className="btn-icon" title="View Details">📊</button>
                    <button className="btn-icon" title="Edit Campaign">✏️</button>
                    <button className="btn-icon" title="Duplicate">📋</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </main>
    </div>
  );
}
