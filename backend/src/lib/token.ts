import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';

export type AccessTokenPayload = {
  sub: string;
  role: string;
  department: string;
};

export function signAccessToken(payload: AccessTokenPayload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as jwt.JwtPayload & AccessTokenPayload;
}

export function createRefreshToken() {
  return crypto.randomBytes(48).toString('base64url');
}

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function parseDurationToMs(duration: string) {
  const match = duration.match(/^(\d+)([smhd])$/);

  if (!match) {
    throw new Error(`Unsupported duration: ${duration}`);
  }

  const value = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Unsupported duration: ${duration}`);
  }
}
