import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        name: string;
        company: string;
        role: string;
      };
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Get user from database
    const result = await query(`
      SELECT id, email, name, company, role
      FROM users 
      WHERE id = $1
    `, [decoded.userId]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    
    // Attach user to request object
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      company: user.company,
      role: user.role
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

// Optional auth middleware - doesn't fail if no token provided
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // No token provided, continue without user
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Get user from database
    const result = await query(`
      SELECT id, email, name, company, role
      FROM users 
      WHERE id = $1
    `, [decoded.userId]);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company,
        role: user.role
      };
    }

    next();
  } catch (error) {
    // If token is invalid, continue without user (don't block request)
    next();
  }
};

// Role-based authorization middleware
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

export default { authenticateToken, optionalAuth, requireRole };