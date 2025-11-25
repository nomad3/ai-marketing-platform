import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './index.css';
import Analytics from './pages/Analytics';
import Campaigns from './pages/Campaigns';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/campaigns" element={<Campaigns />} />
      </Routes>
    </Router>
  );
}

export default App;
