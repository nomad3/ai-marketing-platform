import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Building2,
  Clock,
  ExternalLink,
  FileText,
  GitBranch,
  LayoutDashboard,
  Linkedin,
  LogOut,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Send,
  Sparkles,
  StickyNote,
  Target,
  TrendingUp,
  User,
  Users,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ProspectDetail.css';

interface Signal {
  id: number;
  signal_category: string;
  signal_type: string;
  signal_description: string;
  signal_strength: number;
  confidence: number;
  source_type: string;
}

interface Activity {
  id: number;
  activity_type: string;
  title: string;
  content: string;
  metadata: any;
  created_at: string;
}

interface OutreachDraft {
  id: number;
  outreach_type: string;
  subject: string;
  content: string;
  status: string;
  created_at: string;
}

interface Prospect {
  id: number;
  company_name: string;
  industry: string;
  sub_industry: string;
  website: string;
  location_city: string;
  location_state: string;
  location_country: string;
  estimated_revenue_min: number;
  estimated_revenue_max: number;
  employee_count_range: string;
  year_founded: number;
  owner_name: string;
  owner_title: string;
  owner_linkedin: string;
  owner_email: string;
  owner_phone: string;
  owner_estimated_age: number;
  ownership_type: string;
  sell_likelihood_score: number;
  score_breakdown: Record<string, number>;
  ai_research: any;
  stage: string;
  source: string;
  notes: string;
  tags: string[];
  created_at: string;
}

export default function ProspectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [outreachDrafts, setOutreachDrafts] = useState<OutreachDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [researching, setResearching] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [activeTab, setActiveTab] = useState<'research' | 'outreach' | 'activity'>('research');
  const [outreachType, setOutreachType] = useState<string>('cold_email');

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    fetchProspectDetail();
  }, [id, isAuthenticated, navigate]);

  const fetchProspectDetail = async () => {
    try {
      const res = await fetch(`/api/prospects/${id}`);
      const data = await res.json();
      setProspect(data.prospect);
      setSignals(data.signals || []);
      setActivities(data.activities || []);
      setOutreachDrafts(data.outreach_drafts || []);
    } catch (error) {
      console.error('Failed to fetch prospect:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScore = async () => {
    setScoring(true);
    try {
      const res = await fetch(`/api/prospects/${id}/score`, { method: 'POST' });
      const data = await res.json();
      setProspect(data.prospect);
      setSignals(data.signals || []);
      fetchProspectDetail();
    } catch (error) {
      console.error('Failed to score prospect:', error);
    } finally {
      setScoring(false);
    }
  };

  const handleResearch = async () => {
    setResearching(true);
    try {
      const res = await fetch(`/api/prospects/${id}/research`, { method: 'POST' });
      const data = await res.json();
      setProspect(data.prospect);
      fetchProspectDetail();
    } catch (error) {
      console.error('Failed to generate research:', error);
    } finally {
      setResearching(false);
    }
  };

  const handleGenerateOutreach = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/outreach/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospect_id: parseInt(id!), outreach_type: outreachType }),
      });
      const data = await res.json();
      setOutreachDrafts(prev => [data.draft, ...prev]);
      setActiveTab('outreach');
    } catch (error) {
      console.error('Failed to generate outreach:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleStageChange = async (newStage: string) => {
    try {
      const res = await fetch(`/api/prospects/${id}/stage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      });
      const data = await res.json();
      setProspect(data.prospect);
      fetchProspectDetail();
    } catch (error) {
      console.error('Failed to change stage:', error);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      await fetch(`/api/prospects/${id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote }),
      });
      setNewNote('');
      fetchProspectDetail();
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return '#00f2fe';
    if (score >= 50) return '#fee140';
    return '#b8c1ec';
  };

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      ownership_succession: 'Ownership & Succession',
      market_timing: 'Market & Timing',
      company_performance: 'Company Performance',
      external_triggers: 'External Triggers',
      negative: 'Negative Signals',
    };
    return labels[cat] || cat;
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'ownership_succession': return <User size={14} />;
      case 'market_timing': return <TrendingUp size={14} />;
      case 'company_performance': return <BarChart3 size={14} />;
      case 'external_triggers': return <Zap size={14} />;
      case 'negative': return <Target size={14} />;
      default: return <Sparkles size={14} />;
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
    return '—';
  };

  const handleLogout = async () => { await logout(); navigate('/'); };

  if (loading || !prospect) {
    return <div className="dashboard-loading"><div className="spinner"></div><p>Loading prospect...</p></div>;
  }

  const research = prospect.ai_research || {};
  const groupedSignals = signals.reduce((acc, s) => {
    if (!acc[s.signal_category]) acc[s.signal_category] = [];
    acc[s.signal_category].push(s);
    return acc;
  }, {} as Record<string, Signal[]>);

  return (
    <div className="dashboard">
      <aside className="dashboard-sidebar glass">
        <div className="sidebar-header"><Zap className="sidebar-logo" /><span>HCA Deal Intel</span></div>
        <nav className="sidebar-nav">
          <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}><LayoutDashboard size={20} /><span>Overview</span></a>
          <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate('/campaigns'); }}><Target size={20} /><span>Campaigns</span></a>
          <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate('/analytics'); }}><BarChart3 size={20} /><span>Analytics</span></a>
          <div className="nav-section-label">Deal Intelligence</div>
          <a href="#" className="nav-item active" onClick={(e) => { e.preventDefault(); navigate('/prospects'); }}><Users size={20} /><span>Prospects</span></a>
          <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate('/pipeline'); }}><GitBranch size={20} /><span>Pipeline</span></a>
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
        {/* Top Bar */}
        <header className="prospect-header">
          <div className="prospect-header-left">
            <button className="btn-back" onClick={() => navigate('/prospects')}>
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1>{prospect.company_name}</h1>
              <p>{[prospect.industry, prospect.sub_industry].filter(Boolean).join(' / ')} {prospect.location_city && prospect.location_state ? `- ${prospect.location_city}, ${prospect.location_state}` : ''}</p>
            </div>
          </div>
          <div className="prospect-header-actions">
            <select value={prospect.stage} onChange={(e) => handleStageChange(e.target.value)} className="stage-select">
              <option value="lead">Lead</option>
              <option value="contacted">Contacted</option>
              <option value="engaged">Engaged</option>
              <option value="active_deal">Active Deal</option>
              <option value="closed_won">Won</option>
              <option value="closed_lost">Lost</option>
            </select>
            <button className="btn btn-secondary" onClick={handleScore} disabled={scoring}>
              <RefreshCw size={16} className={scoring ? 'spinning' : ''} /> {scoring ? 'Scoring...' : 'Score'}
            </button>
            <button className="btn btn-secondary" onClick={handleResearch} disabled={researching}>
              <BookOpen size={16} className={researching ? 'spinning' : ''} /> {researching ? 'Researching...' : 'Research'}
            </button>
            <div className="outreach-group">
              <select value={outreachType} onChange={(e) => setOutreachType(e.target.value)} className="outreach-select">
                <option value="cold_email">Cold Email</option>
                <option value="follow_up">Follow-up</option>
                <option value="linkedin_message">LinkedIn</option>
                <option value="intro_one_pager">One-Pager</option>
              </select>
              <button className="btn btn-primary" onClick={handleGenerateOutreach} disabled={generating}>
                <Send size={16} /> {generating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </header>

        <div className="prospect-layout">
          {/* Left Column */}
          <div className="prospect-left">
            {/* Company Overview */}
            <div className="detail-card card glass">
              <h3><Building2 size={18} /> Company Overview</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Revenue</span>
                  <span className="detail-value">{formatRevenue(prospect.estimated_revenue_min, prospect.estimated_revenue_max)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Employees</span>
                  <span className="detail-value">{prospect.employee_count_range || '—'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Founded</span>
                  <span className="detail-value">{prospect.year_founded || '—'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Ownership</span>
                  <span className="detail-value" style={{ textTransform: 'capitalize' }}>{prospect.ownership_type || '—'}</span>
                </div>
                {prospect.website && (
                  <div className="detail-item full-width">
                    <span className="detail-label">Website</span>
                    <a href={prospect.website.startsWith('http') ? prospect.website : `https://${prospect.website}`} target="_blank" rel="noopener noreferrer" className="detail-link">
                      {prospect.website} <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Owner Card */}
            {prospect.owner_name && (
              <div className="detail-card card glass">
                <h3><User size={18} /> Owner / CEO</h3>
                <div className="owner-info">
                  <div className="owner-main">
                    <div className="owner-avatar">{prospect.owner_name.split(' ').map(n => n[0]).join('')}</div>
                    <div>
                      <div className="owner-name">{prospect.owner_name}</div>
                      <div className="owner-title">{prospect.owner_title || 'CEO & Founder'}</div>
                      {prospect.owner_estimated_age && <div className="owner-age">Est. age: {prospect.owner_estimated_age}</div>}
                    </div>
                  </div>
                  <div className="owner-contacts">
                    {prospect.owner_email && <a href={`mailto:${prospect.owner_email}`} className="contact-link"><Mail size={14} /> {prospect.owner_email}</a>}
                    {prospect.owner_phone && <a href={`tel:${prospect.owner_phone}`} className="contact-link"><Phone size={14} /> {prospect.owner_phone}</a>}
                    {prospect.owner_linkedin && <a href={prospect.owner_linkedin} target="_blank" rel="noopener noreferrer" className="contact-link"><Linkedin size={14} /> LinkedIn</a>}
                  </div>
                </div>
              </div>
            )}

            {/* Tabs: Research / Outreach / Activity */}
            <div className="detail-tabs">
              <button className={`tab ${activeTab === 'research' ? 'active' : ''}`} onClick={() => setActiveTab('research')}>
                <BookOpen size={16} /> Research Brief
              </button>
              <button className={`tab ${activeTab === 'outreach' ? 'active' : ''}`} onClick={() => setActiveTab('outreach')}>
                <FileText size={16} /> Outreach ({outreachDrafts.length})
              </button>
              <button className={`tab ${activeTab === 'activity' ? 'active' : ''}`} onClick={() => setActiveTab('activity')}>
                <Clock size={16} /> Activity ({activities.length})
              </button>
            </div>

            {/* Research Tab */}
            {activeTab === 'research' && (
              <div className="detail-card card glass">
                {research.executive_summary ? (
                  <>
                    <div className="research-section">
                      <h4>Executive Summary</h4>
                      <p>{research.executive_summary}</p>
                    </div>
                    {research.company_overview && (
                      <div className="research-section">
                        <h4>Company Overview</h4>
                        <p>{research.company_overview.description}</p>
                        {research.company_overview.products_services?.length > 0 && (
                          <div className="research-list">
                            <strong>Products/Services:</strong>
                            <ul>{research.company_overview.products_services.map((p: string, i: number) => <li key={i}>{p}</li>)}</ul>
                          </div>
                        )}
                      </div>
                    )}
                    {research.financial_indicators && (
                      <div className="research-section">
                        <h4>Financial Indicators</h4>
                        <div className="research-metrics">
                          <div><strong>Revenue:</strong> {research.financial_indicators.estimated_revenue}</div>
                          <div><strong>EBITDA Range:</strong> {research.financial_indicators.estimated_ebitda_range}</div>
                          <div><strong>Growth:</strong> {research.financial_indicators.growth_trajectory}</div>
                        </div>
                      </div>
                    )}
                    {research.comparable_transactions?.length > 0 && (
                      <div className="research-section">
                        <h4>Comparable Transactions</h4>
                        <div className="comps-list">
                          {research.comparable_transactions.map((tx: any, i: number) => (
                            <div key={i} className="comp-item">
                              <span className="comp-target">{tx.target}</span>
                              <span className="comp-arrow">acquired by</span>
                              <span className="comp-acquirer">{tx.acquirer}</span>
                              <span className="comp-multiple">{tx.multiple}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {research.suggested_approach && (
                      <div className="research-section">
                        <h4>Suggested Approach</h4>
                        <div className="approach-badge">{research.suggested_approach.angle?.replace(/_/g, ' ')}</div>
                        <p>{research.suggested_approach.reasoning}</p>
                        {research.suggested_approach.talking_points?.length > 0 && (
                          <div className="talking-points">
                            <strong>Talking Points:</strong>
                            <ul>{research.suggested_approach.talking_points.map((tp: string, i: number) => <li key={i}>{tp}</li>)}</ul>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="empty-research">
                    <BookOpen size={32} />
                    <p>No research brief yet.</p>
                    <button className="btn btn-primary" onClick={handleResearch} disabled={researching}>
                      {researching ? 'Generating...' : 'Generate Research Brief'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Outreach Tab */}
            {activeTab === 'outreach' && (
              <div className="detail-card card glass">
                {outreachDrafts.length > 0 ? (
                  <div className="outreach-list">
                    {outreachDrafts.map((draft) => (
                      <div key={draft.id} className="outreach-item">
                        <div className="outreach-item-header">
                          <span className={`outreach-type-badge type-${draft.outreach_type}`}>{draft.outreach_type.replace(/_/g, ' ')}</span>
                          <span className={`outreach-status status-${draft.status}`}>{draft.status}</span>
                          <span className="outreach-date">{new Date(draft.created_at).toLocaleDateString()}</span>
                        </div>
                        {draft.subject && <div className="outreach-subject">{draft.subject}</div>}
                        <div className="outreach-content">{draft.content}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-research">
                    <MessageSquare size={32} />
                    <p>No outreach drafts yet.</p>
                    <button className="btn btn-primary" onClick={handleGenerateOutreach} disabled={generating}>
                      {generating ? 'Generating...' : 'Generate Outreach'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="detail-card card glass">
                <form onSubmit={handleAddNote} className="note-form">
                  <div className="note-input-group">
                    <StickyNote size={16} />
                    <input type="text" placeholder="Add a note..." value={newNote} onChange={(e) => setNewNote(e.target.value)} />
                    <button type="submit" className="btn btn-secondary btn-sm">Add</button>
                  </div>
                </form>
                <div className="activity-timeline">
                  {activities.map((a) => (
                    <div key={a.id} className="activity-item">
                      <div className="activity-dot"></div>
                      <div className="activity-content">
                        <div className="activity-title">{a.title}</div>
                        {a.content && <div className="activity-detail">{a.content}</div>}
                        <div className="activity-time">{new Date(a.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                  {activities.length === 0 && <p className="empty-text">No activity yet.</p>}
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="prospect-right">
            {/* Score Gauge */}
            <div className="detail-card card glass score-card">
              <h3>Sell Likelihood Score</h3>
              <div className="score-gauge">
                <svg viewBox="0 0 120 120" className="score-ring">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                  <circle cx="60" cy="60" r="50" fill="none"
                    stroke={getScoreColor(prospect.sell_likelihood_score)}
                    strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={`${(prospect.sell_likelihood_score / 100) * 314} 314`}
                    transform="rotate(-90 60 60)" />
                </svg>
                <div className="score-center">
                  <span className="score-number" style={{ color: getScoreColor(prospect.sell_likelihood_score) }}>
                    {prospect.sell_likelihood_score || 0}
                  </span>
                  <span className="score-label">/ 100</span>
                </div>
              </div>
              {prospect.score_breakdown && (
                <div className="score-breakdown">
                  {Object.entries(prospect.score_breakdown).map(([cat, score]) => (
                    <div key={cat} className="breakdown-item">
                      <span className="breakdown-label">{getCategoryLabel(cat)}</span>
                      <div className="breakdown-bar">
                        <div className="breakdown-fill" style={{
                          width: `${Math.min(100, score as number)}%`,
                          background: cat === 'negative' ? '#f5576c' : 'var(--primary-gradient)',
                        }}></div>
                      </div>
                      <span className="breakdown-value">{Math.round(score as number)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Signals Panel */}
            <div className="detail-card card glass">
              <h3><Sparkles size={18} /> Signals ({signals.length})</h3>
              {Object.entries(groupedSignals).map(([category, catSignals]) => (
                <div key={category} className="signal-group">
                  <div className="signal-group-header">
                    {getCategoryIcon(category)}
                    <span>{getCategoryLabel(category)}</span>
                    <span className="signal-count">{catSignals.length}</span>
                  </div>
                  {catSignals.map((signal) => (
                    <div key={signal.id} className={`signal-item ${category === 'negative' ? 'signal-negative' : ''}`}>
                      <div className="signal-description">{signal.signal_description}</div>
                      <div className="signal-meta">
                        <div className="strength-bar">
                          <div className="strength-fill" style={{
                            width: `${signal.signal_strength * 10}%`,
                            background: category === 'negative' ? '#f5576c' : 'var(--primary-gradient)',
                          }}></div>
                        </div>
                        <span className="signal-strength">{signal.signal_strength}/10</span>
                        <span className="signal-confidence">{Math.round(signal.confidence * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              {signals.length === 0 && (
                <div className="empty-text">
                  <p>No signals detected yet. Click "Score" to analyze.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
