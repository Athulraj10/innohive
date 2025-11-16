import jwt from 'jsonwebtoken';
import { env } from '../config/env';

const JWT_SECRET: string = env.JWT_SECRET;
const JWT_EXPIRES_IN = env.JWT_EXPIRES_IN;

export interface JWTPayload {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};


export const calculateCookieMaxAge = (expiresIn: string): number => {
  const expiresInValue = parseInt(expiresIn.slice(0, -1), 10);
  const expiresInUnit = expiresIn.slice(-1);
  
  if (isNaN(expiresInValue) || expiresInValue <= 0) {
 
    return 7 * 24 * 60 * 60 * 1000;
  }
  
  switch (expiresInUnit) {
    case 'd':
      return expiresInValue * 24 * 60 * 60 * 1000;
    case 'h':
      return expiresInValue * 60 * 60 * 1000;
    case 'm':
      return expiresInValue * 60 * 1000;
    case 's':
      return expiresInValue * 1000;
    default:
      return 7 * 24 * 60 * 60 * 1000;
  }
};

