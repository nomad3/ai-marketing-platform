import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  DollarSign,
  Download,
  Eye,
  LayoutDashboard,
  LogOut,
  MousePointer,
  ShoppingCart,
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

interface ABTestResult {
  id: string;
  campaignName: string;
  testType: 'creative' | 'audience' | 'bidding' | 'placement';
  variant: 'A' | 'B';
  impressions: number;
  clicks: number;
  conversions: number;
  conversionRate: number;
  costPerConversion: number;
  significance: number;
  status: 'running' | 'completed' | 'planning';
  winner?: 'A' | 'B' | 'inconclusive';
  lift?: number;
}

export default function Analytics() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignPerformance[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [platformData, setPlatformData] = useState<PlatformPerformance[]>([]);
  const [abTestResults, setAbTestResults] = useState<ABTestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedChart, setSelectedChart] = useState<'revenue' | 'roi' | 'performance' | 'conversions'>('revenue');
  const [_selectedPlatforms, _setSelectedPlatforms] = useState<string[]>([]);
  const [showABTests, setShowABTests] = useState(false);

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
    try {
      // Fetch overview analytics
      const response = await fetch(`/api/analytics/overview?range=${timeRange}`);
      const data = await response.json();
      setAnalytics(data);

      // Fetch campaign performance
      const campaignsResponse = await fetch(`/api/analytics/campaigns?range=${timeRange}`);
      const campaignsData = await campaignsResponse.json();
      setCampaigns(campaignsData.campaigns || []);

      // Generate time series data (mock for now)
      setTimeSeriesData(generateTimeSeriesData(timeRange));
      
      // Generate platform performance data
      setPlatformData(generatePlatformData(campaignsData.campaigns || []));
      
      // Generate A/B test results
      setAbTestResults(generateABTestData());
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate mock time series data
  const generateTimeSeriesData = (range: string): TimeSeriesData[] => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
    const data: TimeSeriesData[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const baseImpressions = Math.floor(Math.random() * 10000) + 5000;
      const baseCTR = Math.random() * 3 + 1.5; // 1.5-4.5%
      const baseConversionRate = Math.random() * 5 + 2; // 2-7%
      
      const clicks = Math.floor(baseImpressions * (baseCTR / 100));
      const conversions = Math.floor(clicks * (baseConversionRate / 100));
      const spend = Math.floor(clicks * (Math.random() * 2 + 1.5)); // $1.5-3.5 CPC
      const revenue = Math.floor(conversions * (Math.random() * 50 + 75)); // $75-125 per conversion
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        impressions: baseImpressions,
        clicks,
        conversions,
        spend,
        revenue,
        roi: spend > 0 ? Math.round(((revenue - spend) / spend) * 100) : 0,
        ctr: parseFloat(baseCTR.toFixed(2)),
        conversionRate: parseFloat(baseConversionRate.toFixed(2))
      });
    }
    
    return data;
  };

  // Generate platform performance data
  const generatePlatformData = (campaigns: CampaignPerformance[]): PlatformPerformance[] => {
    const platforms = ['meta', 'google', 'tiktok', 'linkedin'];
    const colors = ['#1877F2', '#4285F4', '#FF0050', '#0077B5'];
    
    return platforms.map((platform, index) => {
      const platformCampaigns = campaigns.filter(c => c.platform === platform);
      const totalSpend = platformCampaigns.reduce((sum, c) => sum + c.spend, 0);
      const totalRevenue = platformCampaigns.reduce((sum, c) => sum + c.revenue, 0);
      
      return {
        platform: platform.charAt(0).toUpperCase() + platform.slice(1),
        spend: totalSpend,
        revenue: totalRevenue,
        roi: totalSpend > 0 ? Math.round(((totalRevenue - totalSpend) / totalSpend) * 100) : 0,
        campaigns: platformCampaigns.length,
        color: colors[index]
      };
    });
  };

  // Generate A/B test data
  const generateABTestData = (): ABTestResult[] => {
    const testTypes: Array<'creative' | 'audience' | 'bidding' | 'placement'> = ['creative', 'audience', 'bidding', 'placement'];
    const campaigns = ['Summer Sale 2024', 'Q4 Holiday Campaign', 'Brand Awareness Push', 'Lead Gen Expansion'];
    
    return Array.from({ length: 8 }, (_, i) => {
      const testType = testTypes[i % testTypes.length];
      const variant = i % 2 === 0 ? 'A' as const : 'B' as const;
      const baseConversions = Math.floor(Math.random() * 100) + 50;
      const impressions = Math.floor(Math.random() * 10000) + 5000;
      const clicks = Math.floor(impressions * 0.03);
      const conversionRate = (baseConversions / clicks) * 100;
      const costPerConversion = Math.random() * 20 + 15;
      
      return {
        id: `test_${i + 1}`,
        campaignName: campaigns[i % campaigns.length],
        testType,
        variant,
        impressions,
        clicks,
        conversions: baseConversions,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        costPerConversion: parseFloat(costPerConversion.toFixed(2)),
        significance: Math.random() * 40 + 80, // 80-100%
        status: i < 2 ? 'running' as const : i < 6 ? 'completed' as const : 'planning' as const,
        winner: i < 6 ? (Math.random() > 0.5 ? 'A' as const : 'B' as const) : undefined,
        lift: i < 6 ? parseFloat((Math.random() * 30 + 5).toFixed(1)) : undefined
      };
    });
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
      abTestResults,
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
          <span>AI Marketing</span>
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
          </div>
        )}

        {selectedChart === 'roi' && (
          <div className="chart-container">
            <h3>ROI Performance Analysis</h3>
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
          </div>
        )}

        {selectedChart === 'performance' && (
          <div className="chart-container">
            <h3>Performance Metrics Over Time</h3>
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
          </div>
        )}

        {selectedChart === 'conversions' && (
          <div className="chart-container">
            <h3>Conversion Funnel Analysis</h3>
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
          </div>
        )}
      </div>

      {/* Platform Performance */}
      <div className="platform-performance-section">
        <h2>Platform Performance Comparison</h2>
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
      </div>

      {/* A/B Test Results */}
      {showABTests && (
        <div className="ab-test-section">
          <h2>A/B Test Results</h2>
          <div className="ab-test-grid">
            {abTestResults.map((test) => (
              <div key={test.id} className="ab-test-card glass">
                <div className="test-header">
                  <div className="test-info">
                    <h4>{test.campaignName}</h4>
                    <span className="test-type">{test.testType.toUpperCase()} TEST</span>
                  </div>
                  <div className={`test-status status-${test.status}`}>
                    {test.status.toUpperCase()}
                  </div>
                </div>
                
                <div className="test-metrics">
                  <div className="metric">
                    <span className="metric-label">Variant</span>
                    <span className="metric-value">{test.variant}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Conversion Rate</span>
                    <span className="metric-value">{test.conversionRate}%</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Cost/Conv</span>
                    <span className="metric-value">${test.costPerConversion}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Significance</span>
                    <span className="metric-value">{test.significance}%</span>
                  </div>
                </div>

                {test.winner && test.lift && (
                  <div className="test-result">
                    <span className={`winner-badge ${test.winner === test.variant ? 'winner' : 'challenger'}`}>
                      {test.winner === test.variant ? '🏆 WINNER' : '📊 CHALLENGER'}
                    </span>
                    <span className="lift-value">+{test.lift}% lift</span>
                  </div>
                )}
              </div>
            ))}
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
