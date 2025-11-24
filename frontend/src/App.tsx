import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './index.css';
import LandingPage from './pages/LandingPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        {/* Dashboard and other routes will be added here */}
      </Routes>
    </Router>
  );
}

export default App;
