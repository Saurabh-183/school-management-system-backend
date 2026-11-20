import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { Role } from '../constants/index.js';

export interface TokenPayload {
  userId: string;
  email: string;
  fullName: string;
  role: Role;
  teacherId?: string | null;
  sessionId?: string;
}

export const signAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as any,
  });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
};
