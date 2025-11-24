import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './index.css';
import Analytics from './pages/Analytics';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </Router>
  );
}

export default App;
