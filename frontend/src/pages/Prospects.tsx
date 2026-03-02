import {
  ArrowUpDown,
  BarChart3,
  Building2,
  Filter,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  Sparkles,
  Target,
  Users,
  Zap,
  GitBranch,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProspectDiscovery from '../components/ProspectDiscovery';
import './Prospects.css';

interface Prospect {
  id: number;
  company_name: string;
  industry: string;
  sub_industry: string;
  location_city: string;
  location_state: string;
  estimated_revenue_min: number;
  estimated_revenue_max: number;
  sell_likelihood_score: number;
  stage: string;
  owner_name: string;
  ownership_type: string;
  source: string;
  created_at: string;
}

export default function Prospects() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Filters
  const [stageFilter, setStageFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('sell_likelihood_score');
  const [sortOrder, setSortOrder] = useState('desc');

  // Add form
  const [newProspect, setNewProspect] = useState({
    company_name: '', industry: 'healthcare', owner_name: '',
    location_city: '', location_state: '',
    estimated_revenue_min: '', estimated_revenue_max: '',
    website: '', ownership_type: 'founder',
  });

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { navigate('/login'); return; }
    fetchProspects();
  }, [authLoading, isAuthenticated, navigate, stageFilter, industryFilter, searchQuery, sortBy, sortOrder]);

  const fetchProspects = async () => {
    try {
      const params = new URLSearchParams();
      if (stageFilter) params.set('stage', stageFilter);
      if (industryFilter) params.set('industry', industryFilter);
      if (searchQuery) params.set('search', searchQuery);
      params.set('sort_by', sortBy);
      params.set('sort_order', sortOrder);

      const res = await fetch(`/api/prospects?${params}`);
      const data = await res.json();
      setProspects(data.prospects || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch prospects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProspect = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProspect,
          estimated_revenue_min: newProspect.estimated_revenue_min ? parseInt(newProspect.estimated_revenue_min) : null,
          estimated_revenue_max: newProspect.estimated_revenue_max ? parseInt(newProspect.estimated_revenue_max) : null,
        }),
      });
      if (res.ok) {
        setShowAddForm(false);
        setNewProspect({ company_name: '', industry: 'healthcare', owner_name: '', location_city: '', location_state: '', estimated_revenue_min: '', estimated_revenue_max: '', website: '', ownership_type: 'founder' });
        fetchProspects();
      }
    } catch (error) {
      console.error('Failed to add prospect:', error);
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const formatRevenue = (min: number, max: number) => {
    const fmt = (n: number) => {
      if (!n) return '';
      if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
      if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
      return `$${n}`;
    };
    if (min && max) return `${fmt(min)} - ${fmt(max)}`;
    if (min) return `${fmt(min)}+`;
    if (max) return `Up to ${fmt(max)}`;
    return '—';
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return '#00f2fe';
    if (score >= 50) return '#fee140';
    return '#b8c1ec';
  };

  const getStageBadge = (stage: string) => {
    const stageLabels: Record<string, string> = {
      lead: 'Lead', contacted: 'Contacted', engaged: 'Engaged',
      active_deal: 'Active Deal', closed_won: 'Won', closed_lost: 'Lost',
    };
    return stageLabels[stage] || stage;
  };

  const handleLogout = async () => { await logout(); navigate('/'); };

  if (loading) {
    return <div className="dashboard-loading"><div className="spinner"></div><p>Loading prospects...</p></div>;
  }

  return (
    <div className="dashboard">
      <aside className="dashboard-sidebar glass">
        <div className="sidebar-header">
          <Zap className="sidebar-logo" />
          <span>HCA Deal Intel</span>
        </div>
        <nav className="sidebar-nav">
          <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}>
            <LayoutDashboard size={20} /><span>Overview</span>
          </a>
          <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate('/campaigns'); }}>
            <Target size={20} /><span>Campaigns</span>
          </a>
          <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate('/analytics'); }}>
            <BarChart3 size={20} /><span>Analytics</span>
          </a>
          <div className="nav-section-label">Deal Intelligence</div>
          <a href="#" className="nav-item active" onClick={(e) => { e.preventDefault(); navigate('/prospects'); }}>
            <Users size={20} /><span>Prospects</span>
          </a>
          <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate('/pipeline'); }}>
            <GitBranch size={20} /><span>Pipeline</span>
          </a>
        </nav>
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">{user?.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}</div>
            <div className="user-info">
              <div className="user-name">{user?.name || 'User'}</div>
              <div className="user-email">{user?.email || ''}</div>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Logout"><LogOut size={16} /></button>
          </div>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>Prospects</h1>
            <p>{total} companies in pipeline</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={() => setShowAddForm(true)}>
              <Plus size={18} /> Add Prospect
            </button>
            <button className="btn btn-primary" onClick={() => setShowDiscovery(true)}>
              <Sparkles size={18} /> AI Discover
            </button>
          </div>
        </header>

        {/* Filters */}
        <div className="filters-bar card glass">
          <div className="filter-group">
            <Filter size={16} />
            <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
              <option value="">All Stages</option>
              <option value="lead">Lead</option>
              <option value="contacted">Contacted</option>
              <option value="engaged">Engaged</option>
              <option value="active_deal">Active Deal</option>
              <option value="closed_won">Won</option>
              <option value="closed_lost">Lost</option>
            </select>
            <select value={industryFilter} onChange={(e) => setIndustryFilter(e.target.value)}>
              <option value="">All Industries</option>
              <option value="healthcare">Healthcare</option>
              <option value="consumer">Consumer</option>
              <option value="industrial">Industrial</option>
              <option value="business_services">Business Services</option>
            </select>
          </div>
          <div className="search-group">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search companies or owners..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Prospects Table */}
        <div className="prospects-table card glass">
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('company_name')} className="sortable">
                  Company <ArrowUpDown size={14} />
                </th>
                <th>Industry</th>
                <th>Revenue</th>
                <th onClick={() => handleSort('sell_likelihood_score')} className="sortable">
                  Score <ArrowUpDown size={14} />
                </th>
                <th>Stage</th>
                <th>Owner</th>
                <th>Location</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {prospects.map((p) => (
                <tr key={p.id} onClick={() => navigate(`/prospects/${p.id}`)} className="clickable-row">
                  <td className="company-name-cell">
                    <Building2 size={16} className="company-icon" />
                    <span>{p.company_name}</span>
                  </td>
                  <td>
                    <span className={`industry-badge industry-${p.industry}`}>
                      {p.industry || '—'}
                    </span>
                  </td>
                  <td className="revenue-cell">{formatRevenue(p.estimated_revenue_min, p.estimated_revenue_max)}</td>
                  <td>
                    <div className="score-badge" style={{ borderColor: getScoreColor(p.sell_likelihood_score) }}>
                      <span className="score-value" style={{ color: getScoreColor(p.sell_likelihood_score) }}>
                        {p.sell_likelihood_score || 0}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`stage-badge stage-${p.stage}`}>{getStageBadge(p.stage)}</span>
                  </td>
                  <td className="owner-cell">{p.owner_name || '—'}</td>
                  <td>{[p.location_city, p.location_state].filter(Boolean).join(', ') || '—'}</td>
                  <td>
                    <span className={`source-badge source-${p.source}`}>{p.source || '—'}</span>
                  </td>
                </tr>
              ))}
              {prospects.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty-state">
                    <Sparkles size={32} />
                    <p>No prospects yet. Use AI Discover to find companies.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Add Prospect Modal */}
      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal-content card glass" onClick={(e) => e.stopPropagation()}>
            <h2>Add Prospect</h2>
            <form onSubmit={handleAddProspect}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Company Name *</label>
                  <input type="text" required value={newProspect.company_name}
                    onChange={(e) => setNewProspect({ ...newProspect, company_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Industry</label>
                  <select value={newProspect.industry}
                    onChange={(e) => setNewProspect({ ...newProspect, industry: e.target.value })}>
                    <option value="healthcare">Healthcare</option>
                    <option value="consumer">Consumer</option>
                    <option value="industrial">Industrial</option>
                    <option value="business_services">Business Services</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Owner/CEO Name</label>
                  <input type="text" value={newProspect.owner_name}
                    onChange={(e) => setNewProspect({ ...newProspect, owner_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Website</label>
                  <input type="text" value={newProspect.website}
                    onChange={(e) => setNewProspect({ ...newProspect, website: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input type="text" value={newProspect.location_city}
                    onChange={(e) => setNewProspect({ ...newProspect, location_city: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input type="text" value={newProspect.location_state}
                    onChange={(e) => setNewProspect({ ...newProspect, location_state: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Revenue Min ($)</label>
                  <input type="number" value={newProspect.estimated_revenue_min}
                    onChange={(e) => setNewProspect({ ...newProspect, estimated_revenue_min: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Revenue Max ($)</label>
                  <input type="number" value={newProspect.estimated_revenue_max}
                    onChange={(e) => setNewProspect({ ...newProspect, estimated_revenue_max: e.target.value })} />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Prospect</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Discovery Modal */}
      <ProspectDiscovery
        isOpen={showDiscovery}
        onClose={() => setShowDiscovery(false)}
        onProspectsAdded={() => { setShowDiscovery(false); fetchProspects(); }}
      />
    </div>
  );
}
