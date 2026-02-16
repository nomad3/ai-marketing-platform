import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import Analytics from './pages/Analytics';
import Campaigns from './pages/Campaigns';
import Content from './pages/Content';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Pipeline from './pages/Pipeline';
import ProspectDetail from './pages/ProspectDetail';
import Prospects from './pages/Prospects';
import Register from './pages/Register';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/content" element={<Content />} />
          <Route path="/prospects" element={<Prospects />} />
          <Route path="/prospects/:id" element={<ProspectDetail />} />
          <Route path="/pipeline" element={<Pipeline />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
