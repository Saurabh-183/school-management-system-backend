import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/token.js';
import { AppError } from '../errors/app-error.js';
import { Role } from '../constants/index.js';
import { User } from '../models/user.model.js';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const authenticateUser = async (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required: Missing or invalid Bearer token', 401));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);

    // Single Active Session Verification:
    // If token has a sessionId, verify it matches the user's active session in MongoDB
    if (decoded.sessionId) {
      const dbUser = await User.findById(decoded.userId).select('currentSessionId');
      if (dbUser && dbUser.currentSessionId && dbUser.currentSessionId !== decoded.sessionId) {
        return next(
          new AppError(
            'Session Terminated: This account has been logged in from another location/device. Concurrent sessions are disabled for security.',
            401
          )
        );
      }
    }

    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Token has expired. Please log in again.', 401));
    }
    return next(new AppError('Invalid authentication token', 401));
  }
};

export const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
  } catch {
    // Ignore invalid token in optionalAuth
  }
  next();
};

export const requireRole = (...allowedRoles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access forbidden: Requires one of [${allowedRoles.join(', ')}] role(s). Current role: '${req.user.role}'`,
          403
        )
      );
    }

    next();
  };
};
