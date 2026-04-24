import { describe, expect, it, beforeEach } from 'bun:test';
import { Elysia } from 'elysia';
import { authRoutes } from '../routes/auth';
import { Keypair } from 'stellar-sdk';
import { jwt } from '@elysiajs/jwt';
import { mock, spyOn } from 'bun:test';
import { userRepository } from '../repositories/UserRepository';
import { errorHandler } from '../middleware/errorHandler';

describe('Auth Routes Integration Tests', () => {
  const app = new Elysia()
    .use(errorHandler)
    .use(
      jwt({
        name: 'jwt',
        secret: 'test-secret',
      })
    )
    .use(authRoutes);

  let keypair: Keypair;
  let stellarAddress: string;

  beforeEach(() => {
    keypair = Keypair.random();
    stellarAddress = keypair.publicKey();
    spyOn(userRepository, 'getOrCreateByWallet').mockImplementation(async (address) => ({
      id: 'mock-user-id',
      walletAddress: address,
      displayName: 'Mock User',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any));
  });

  it('POST /auth/challenge should return a nonce', async () => {
    console.log("stellarAddress:", stellarAddress);
    const response = await app.handle(
      new Request('http://localhost/auth/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stellarAddress }),
      })
    );

    const data = await response.json() as { nonce: string, expiresAt: number };
    if (response.status !== 200) console.log(data);
    expect(response.status).toBe(200);
    expect(data.nonce).toBeDefined();
    expect(typeof data.nonce).toBe('string');
    expect(data.expiresAt).toBeDefined();
  });

  it('POST /auth/session should return JWT for valid signature', async () => {
    // 1. Get challenge
    const challengeRes = await app.handle(
      new Request('http://localhost/auth/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stellarAddress }),
      })
    );
    const { nonce } = await challengeRes.json() as { nonce: string };

    // 2. Sign challenge
    const signatureBuffer = keypair.sign(Buffer.from(nonce));
    const signature = signatureBuffer.toString('base64');

    // 3. Verify session
    const sessionRes = await app.handle(
      new Request('http://localhost/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stellarAddress, signature }),
      })
    );

    expect(sessionRes.status).toBe(200);
    const sessionData = await sessionRes.json() as { token: string, user: any };
    expect(sessionData.token).toBeDefined();
    expect(sessionData.user.walletAddress).toBe(stellarAddress);
  });

  it('POST /auth/session should reject invalid signature', async () => {
    // 1. Get challenge
    const challengeRes = await app.handle(
      new Request('http://localhost/auth/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stellarAddress }),
      })
    );
    const { nonce } = await challengeRes.json() as { nonce: string };

    // 2. Sign with a DIFFERENT key
    const badKeypair = Keypair.random();
    const badSignatureBuffer = badKeypair.sign(Buffer.from(nonce));
    const badSignature = badSignatureBuffer.toString('base64');

    // 3. Verify session
    const sessionRes = await app.handle(
      new Request('http://localhost/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stellarAddress, signature: badSignature }),
      })
    );

    expect(sessionRes.status).toBe(401);
  });

  it('POST /auth/session should reject request without a challenge', async () => {
    const signatureBuffer = keypair.sign(Buffer.from('fake-nonce'));
    const signature = signatureBuffer.toString('base64');

    const sessionRes = await app.handle(
      new Request('http://localhost/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stellarAddress, signature }),
      })
    );

    expect(sessionRes.status).toBe(401);
  });
});
