import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Calendar,
  DollarSign,
  Download,
  Eye,
  MousePointer,
  ShoppingCart,
  TrendingUp
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
}

export default function Analytics() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/analytics/overview?range=${timeRange}`);
      const data = await response.json();
      setAnalytics(data);

      const campaignsResponse = await fetch(`http://localhost:3000/api/analytics/campaigns?range=${timeRange}`);
      const campaignsData = await campaignsResponse.json();
      setCampaigns(campaignsData.campaigns || []);
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

  return (
    <div className="analytics-page">
      {/* Header */}
      <header className="analytics-header">
        <div>
          <button className="btn-back" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
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
          <button className="btn btn-primary">
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
      </div>

      {/* Performance Metrics */}
      <div className="performance-section">
        <h2>Performance Metrics</h2>
        <div className="performance-grid">
          <div className="performance-card glass">
            <Eye className="performance-icon" />
            <div className="performance-label">Total Impressions</div>
            <div className="performance-value">{formatNumber(analytics?.totalImpressions || 0)}</div>
          </div>

          <div className="performance-card glass">
            <MousePointer className="performance-icon" />
            <div className="performance-label">Total Clicks</div>
            <div className="performance-value">{formatNumber(analytics?.totalClicks || 0)}</div>
          </div>

          <div className="performance-card glass">
            <ShoppingCart className="performance-icon" />
            <div className="performance-label">Total Conversions</div>
            <div className="performance-value">{formatNumber(analytics?.totalConversions || 0)}</div>
          </div>

          <div className="performance-card glass">
            <TrendingUp className="performance-icon" />
            <div className="performance-label">CTR</div>
            <div className="performance-value">{formatPercent(analytics?.ctr || 0)}</div>
          </div>

          <div className="performance-card glass">
            <BarChart3 className="performance-icon" />
            <div className="performance-label">Conversion Rate</div>
            <div className="performance-value">{formatPercent(analytics?.conversionRate || 0)}</div>
          </div>

          <div className="performance-card glass">
            <DollarSign className="performance-icon" />
            <div className="performance-label">Cost Per Click</div>
            <div className="performance-value">{formatCurrency(analytics?.costPerClick || 0)}</div>
          </div>

          <div className="performance-card glass">
            <DollarSign className="performance-icon" />
            <div className="performance-label">Cost Per Conversion</div>
            <div className="performance-value">{formatCurrency(analytics?.costPerConversion || 0)}</div>
          </div>

          <div className="performance-card glass">
            <Calendar className="performance-icon" />
            <div className="performance-label">Active Campaigns</div>
            <div className="performance-value">{analytics?.activeCampaigns || 0}</div>
          </div>
        </div>
      </div>

      {/* Campaign Performance Table */}
      <div className="campaigns-performance">
        <h2>Campaign Performance</h2>
        <div className="table-container glass">
          <table>
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Platform</th>
                <th>Impressions</th>
                <th>Clicks</th>
                <th>Conversions</th>
                <th>Spend</th>
                <th>Revenue</th>
                <th>ROI</th>
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
                  <td>{formatNumber(campaign.impressions)}</td>
                  <td>{formatNumber(campaign.clicks)}</td>
                  <td>{formatNumber(campaign.conversions)}</td>
                  <td>{formatCurrency(campaign.spend)}</td>
                  <td>{formatCurrency(campaign.revenue)}</td>
                  <td>
                    <span className={`roi-badge ${campaign.roi >= 0 ? 'positive' : 'negative'}`}>
                      {campaign.roi >= 0 ? '+' : ''}{campaign.roi}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
