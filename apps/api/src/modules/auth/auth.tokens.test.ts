import { describe, expect, it } from 'vitest';

import { JwtTokenService } from './auth.tokens.js';

describe('JwtTokenService', () => {
  it('firma y verifica claims mínimos con secretos separados', async () => {
    const tokens = new JwtTokenService();
    const userId = '11111111-1111-4111-a111-111111111111';
    const issued = await tokens.issuePair(userId, 'ANALISTA', 3);

    await expect(tokens.verifyAccess(issued.accessToken)).resolves.toEqual({
      userId,
      role: 'ANALISTA',
      sessionVersion: 3,
    });
    await expect(tokens.verifyRefresh(issued.refreshToken)).resolves.toEqual({
      userId,
      tokenId: issued.refreshId,
      sessionVersion: 3,
    });
    await expect(tokens.verifyAccess(issued.refreshToken)).rejects.toThrow();
  });

  it('produce un hash irreversible de longitud fija', () => {
    const hash = new JwtTokenService().hash('refresh-visible-solo-aquí');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).not.toContain('refresh-visible');
  });
});
