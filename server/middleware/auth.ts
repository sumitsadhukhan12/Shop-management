import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { store } from '../services/store';
import { UserRole } from '../models/types';

const JWT_SECRET = process.env.JWT_SECRET || 'sadhukhan_varities_super_secure_jwt_secret_key_2026';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    mobile: string;
    role: UserRole;
  };
}

export function generateToken(user: { id: string; name: string; email: string; mobile: string; role: UserRole }): string {
  // 30-minute inactivity auto-logout session token
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '30m' }
  );
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Authentication required. Please login.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      name: string;
      email: string;
      mobile: string;
      role: UserRole;
    };

    // Verify user exists and is active
    const user = store.findUserById(decoded.id);
    if (!user || user.status !== 'active') {
      res.status(401).json({ message: 'User account is inactive or not found.' });
      return;
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role
    };

    next();
  } catch (err) {
    res.status(401).json({ message: 'Session expired or invalid token. Please log in again.' });
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
      return;
    }
    next();
  });
}

// Simple in-memory IP rate limiter for login
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export function loginRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minutes
  const maxAttempts = 15;

  const current = loginAttempts.get(ip);
  if (!current || now > current.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + windowMs });
    return next();
  }

  if (current.count >= maxAttempts) {
    res.status(429).json({
      message: 'Too many login attempts. Please wait 5 minutes before trying again.'
    });
    return;
  }

  current.count += 1;
  next();
}
