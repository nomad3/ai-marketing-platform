import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import analyticsRoutes from './routes/analytics.js';
import authRoutes from './routes/auth.js';
import campaignRoutes from './routes/campaigns.js';
import contentRoutes from './routes/content.js';
import reportsRoutes from './routes/reports.js';
import prospectRoutes from './routes/prospects.js';
import { optionalAuth, authenticateToken } from './middleware/auth.js';
import './db.js'; // Initialize database connection

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files from public directory

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Public API Routes (no auth required)
app.use('/api/auth', authRoutes);

// Protected API Routes (auth required)
app.use('/api/campaigns', optionalAuth, campaignRoutes); // Optional auth for now (backward compatibility)
app.use('/api/analytics', optionalAuth, analyticsRoutes); // Optional auth for now
app.use('/api/content', optionalAuth, contentRoutes); // Optional auth for now
app.use('/api/reports', optionalAuth, reportsRoutes); // Optional auth for now
app.use('/api/prospects', optionalAuth, prospectRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
