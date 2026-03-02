import {
  BarChart3,
  GitBranch,
  LayoutDashboard,
  LogOut,
  Target,
  Users,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Pipeline.css';

interface Prospect {
  id: number;
  company_name: string;
  industry: string;
  sell_likelihood_score: number;
  stage: string;
  stage_changed_at: string;
  owner_name: string;
}

const STAGES = [
  { key: 'lead', label: 'Lead', color: '#b8c1ec' },
  { key: 'contacted', label: 'Contacted', color: '#667eea' },
  { key: 'engaged', label: 'Engaged', color: '#00f2fe' },
  { key: 'active_deal', label: 'Active Deal', color: '#fee140' },
  { key: 'closed_won', label: 'Closed Won', color: '#48c78e' },
  { key: 'closed_lost', label: 'Closed Lost', color: '#f5576c' },
];

export default function Pipeline() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState<number | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { navigate('/login'); return; }
    fetchProspects();
  }, [authLoading, isAuthenticated, navigate]);

  const fetchProspects = async () => {
    try {
      const res = await fetch('/api/prospects?limit=200');
      const data = await res.json();
      setProspects(data.prospects || []);
    } catch (error) {
      console.error('Failed to fetch prospects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, prospectId: number) => {
    e.dataTransfer.setData('text/plain', prospectId.toString());
    setDragging(prospectId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStage: string) => {
    e.preventDefault();
    const prospectId = parseInt(e.dataTransfer.getData('text/plain'));
    setDragging(null);

    try {
      await fetch(`/api/prospects/${prospectId}/stage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      });
      setProspects(prev => prev.map(p =>
        p.id === prospectId ? { ...p, stage: newStage, stage_changed_at: new Date().toISOString() } : p
      ));
    } catch (error) {
      console.error('Failed to update stage:', error);
    }
  };

  const getStageProspects = (stageKey: string) => prospects.filter(p => p.stage === stageKey);

  const getDaysInStage = (stageChangedAt: string) => {
    if (!stageChangedAt) return 0;
    const diff = Date.now() - new Date(stageChangedAt).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return '#00f2fe';
    if (score >= 50) return '#fee140';
    return '#b8c1ec';
  };

  const handleLogout = async () => { await logout(); navigate('/'); };

  // Funnel metrics
  const total = prospects.length;

  if (loading) {
    return <div className="dashboard-loading"><div className="spinner"></div><p>Loading pipeline...</p></div>;
  }

  return (
    <div className="dashboard">
      <aside className="dashboard-sidebar glass">
        <div className="sidebar-header"><Zap className="sidebar-logo" /><span>HCA Deal Intel</span></div>
        <nav className="sidebar-nav">
          <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}><LayoutDashboard size={20} /><span>Overview</span></a>
          <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate('/campaigns'); }}><Target size={20} /><span>Campaigns</span></a>
          <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate('/analytics'); }}><BarChart3 size={20} /><span>Analytics</span></a>
          <div className="nav-section-label">Deal Intelligence</div>
          <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate('/prospects'); }}><Users size={20} /><span>Prospects</span></a>
          <a href="#" className="nav-item active" onClick={(e) => { e.preventDefault(); navigate('/pipeline'); }}><GitBranch size={20} /><span>Pipeline</span></a>
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
            <h1>Deal Pipeline</h1>
            <p>{total} prospects across {STAGES.length} stages</p>
          </div>
        </header>

        {/* Funnel Summary */}
        <div className="funnel-bar card glass">
          {STAGES.map((stage) => {
            const count = getStageProspects(stage.key).length;
            return (
              <div key={stage.key} className="funnel-stage">
                <div className="funnel-count" style={{ color: stage.color }}>{count}</div>
                <div className="funnel-label">{stage.label}</div>
                {total > 0 && <div className="funnel-pct">{Math.round((count / total) * 100)}%</div>}
              </div>
            );
          })}
        </div>

        {/* Kanban Board */}
        <div className="kanban-board">
          {STAGES.map((stage) => (
            <div
              key={stage.key}
              className="kanban-column"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.key)}
            >
              <div className="column-header" style={{ borderTopColor: stage.color }}>
                <span className="column-title">{stage.label}</span>
                <span className="column-count" style={{ background: `${stage.color}22`, color: stage.color }}>
                  {getStageProspects(stage.key).length}
                </span>
              </div>
              <div className="column-cards">
                {getStageProspects(stage.key).map((prospect) => (
                  <div
                    key={prospect.id}
                    className={`kanban-card card glass ${dragging === prospect.id ? 'dragging' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, prospect.id)}
                    onClick={() => navigate(`/prospects/${prospect.id}`)}
                  >
                    <div className="card-top">
                      <span className="card-company">{prospect.company_name}</span>
                      <span className="card-score" style={{ color: getScoreColor(prospect.sell_likelihood_score) }}>
                        {prospect.sell_likelihood_score || 0}
                      </span>
                    </div>
                    <div className="card-meta">
                      <span className={`card-industry industry-${prospect.industry}`}>{prospect.industry}</span>
                      <span className="card-days">{getDaysInStage(prospect.stage_changed_at)}d</span>
                    </div>
                    {prospect.owner_name && (
                      <div className="card-owner">{prospect.owner_name}</div>
                    )}
                  </div>
                ))}
                {getStageProspects(stage.key).length === 0 && (
                  <div className="column-empty">No prospects</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
