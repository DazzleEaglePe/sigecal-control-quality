import { createHash, randomUUID } from 'node:crypto';

import { SignJWT, jwtVerify } from 'jose';
import { z } from 'zod';

import { RoleSchema, type Role } from '@sigecal/shared';

import { env } from '../../config/env.js';
import type {
  AccessClaims,
  IssuedTokenPair,
  RefreshClaims,
  TokenPort,
} from './auth.types.js';

const ISSUER = 'sigecal-api';
const AUDIENCE = 'sigecal-web';
const algorithm = 'HS256';
const encoder = new TextEncoder();

const durationSeconds = (duration: string): number => {
  const value = Number.parseInt(duration.slice(0, -1), 10);
  const unit = duration.at(-1);
  const factors: Readonly<Record<string, number>> = {
    s: 1,
    m: 60,
    h: 3_600,
    d: 86_400,
  };
  return value * (factors[unit ?? ''] ?? 0);
};

const AccessPayloadSchema = z.object({
  sessionVersion: z.number().int().nonnegative(),
  sub: z.uuid(),
  role: RoleSchema,
});
const RefreshPayloadSchema = z.object({
  sub: z.uuid(),
  jti: z.uuid(),
  sessionVersion: z.number().int().nonnegative(),
});

export class JwtTokenService implements TokenPort {
  private readonly accessSecret = encoder.encode(env.JWT_ACCESS_SECRET);
  private readonly refreshSecret = encoder.encode(env.JWT_REFRESH_SECRET);

  public async issuePair(
    userId: string,
    role: Role,
    sessionVersion: number,
  ): Promise<IssuedTokenPair> {
    const refreshId = randomUUID();
    const [accessToken, refreshToken] = await Promise.all([
      this.issueAccess(userId, role, sessionVersion),
      new SignJWT({ sessionVersion })
        .setProtectedHeader({ alg: algorithm })
        .setSubject(userId)
        .setJti(refreshId)
        .setIssuedAt()
        .setIssuer(ISSUER)
        .setAudience(AUDIENCE)
        .setExpirationTime(env.JWT_REFRESH_EXPIRES)
        .sign(this.refreshSecret),
    ]);
    return {
      accessToken,
      refreshToken,
      refreshId,
      refreshExpiresAt: new Date(
        Date.now() + durationSeconds(env.JWT_REFRESH_EXPIRES) * 1_000,
      ),
    };
  }

  public async issueAccess(
    userId: string,
    role: Role,
    sessionVersion: number,
  ): Promise<string> {
    return new SignJWT({ role, sessionVersion })
      .setProtectedHeader({ alg: algorithm })
      .setSubject(userId)
      .setIssuedAt()
      .setIssuer(ISSUER)
      .setAudience(AUDIENCE)
      .setExpirationTime(env.JWT_ACCESS_EXPIRES)
      .sign(this.accessSecret);
  }

  public async verifyAccess(token: string): Promise<AccessClaims> {
    const { payload } = await jwtVerify(token, this.accessSecret, {
      algorithms: [algorithm],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    const parsed = AccessPayloadSchema.parse(payload);
    return {
      userId: parsed.sub,
      role: parsed.role,
      sessionVersion: parsed.sessionVersion,
    };
  }

  public async verifyRefresh(token: string): Promise<RefreshClaims> {
    const { payload } = await jwtVerify(token, this.refreshSecret, {
      algorithms: [algorithm],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    const parsed = RefreshPayloadSchema.parse(payload);
    return {
      userId: parsed.sub,
      tokenId: parsed.jti,
      sessionVersion: parsed.sessionVersion,
    };
  }

  public hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
