import {
  BarChart3,
  LayoutDashboard,
  LogOut,
  Target,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ContentGenerator from '../components/ContentGenerator';
import './Dashboard.css'; // Reuse dashboard styles for consistency

export default function Content() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/');
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
          <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); navigate('/analytics'); }}>
            <BarChart3 size={20} />
            <span>Analytics</span>
          </a>
          <a href="#" className="nav-item active" onClick={(e) => { e.preventDefault(); navigate('/content'); }}>
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
        <div className="dashboard-header">
          <div className="header-content">
            <h1>AI Content Generator</h1>
            <p>Create compelling ad copy and visuals powered by AI</p>
          </div>
        </div>

        {/* Content Generator */}
        <div className="dashboard-content">
          <ContentGenerator />
        </div>
      </main>
    </div>
  );
}