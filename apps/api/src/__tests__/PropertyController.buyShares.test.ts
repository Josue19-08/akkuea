/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it, spyOn, mock } from 'bun:test';

// Mock the DB module BEFORE importing any internal files to override the Proxy export
export let mockTxImpl: any = null;
mock.module('../db', () => ({
  db: {
    transaction: async (fn: any) => {
      if (mockTxImpl) return mockTxImpl(fn);
      return fn({});
    }
  }
}));

import { PropertyController } from '../controllers/PropertyController';
import { stellarService } from '../services/StellarService';
import { db } from '../db';
import { propertyRepository } from '../repositories/PropertyRepository';
import { userRepository } from '../repositories/UserRepository';

const PROPERTY_ID = '11111111-1111-1111-1111-111111111111';
const BUYER_ADDRESS = 'GBUYERADDRESSXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
const OWNER_ADDRESS = 'GOWNERADDRESSXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
const CONTRACT_ID = 'CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
const ADMIN_PUBLIC_KEY = 'GADMINADDRESSXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
const ADMIN_SECRET = 'SADMINSECRETXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

let originalMintPropertyShares: any;
let originalGetMintingConfig: any;

beforeEach(() => {
  originalMintPropertyShares = stellarService.mintPropertyShares;
  originalGetMintingConfig = stellarService.getMintingConfig;
});

afterEach(() => {
  (stellarService as any).mintPropertyShares = originalMintPropertyShares;
  (stellarService as any).getMintingConfig = originalGetMintingConfig;
  // spyOn automatically restores mocks if using bun:test's mock.restore() or similar, 
  // but we can just let spyOn do its thing if we use it correctly.
});

// Skip tests if DATABASE_URL is not set
const skipIfNoDatabase = !process.env.DATABASE_URL;

describe.skipIf(skipIfNoDatabase)('PropertyController.buyShares', () => {
  it('submits a real Soroban transaction and returns the Horizon hash', async () => {
    let mintParams: any = {};

    (stellarService as any).getMintingConfig = () => ({
      contractId: CONTRACT_ID,
      adminPublicKey: ADMIN_PUBLIC_KEY,
      adminSecret: ADMIN_SECRET,
    });

    (stellarService as any).mintPropertyShares = async (params: any) => {
      console.log('MOCK stellarService.mintPropertyShares CALLED');
      mintParams = params;
      return {
        txHash: 'a'.repeat(64),
        contractId: params.contractId,
      };
    };

    let capturedInsert: any = {};

    mockTxImpl = async (fn: any) => {
      const mockTx = {
        select: () => {
          return { from: () => ({ where: () => ({ limit: async () => [] }) }) };
        },
        update: () => {
          return {
            set: () => ({
              where: () => ({ returning: async () => [{ availableShares: 8 }] }),
            }),
          };
        },
        insert: () => {
          return {
            values: (vals: any) => {
              capturedInsert = vals;
              const res = [{ shares: 2 }];
              return Object.assign(Promise.resolve(res), {
                returning: async () => res,
              });
            },
          };
        },
      };
      return fn(mockTx);
    };

    spyOn(propertyRepository, 'findById').mockResolvedValue({
      id: PROPERTY_ID,
      ownerId: OWNER_ADDRESS,
      availableShares: 10,
      pricePerShare: '100.00',
      tokenAddress: CONTRACT_ID,
      sorobanPropertyId: 1,
    } as any);

    spyOn(userRepository, 'getOrCreateByWallet').mockResolvedValue({
      id: 'buyer-id',
      walletAddress: BUYER_ADDRESS,
    } as any);

    spyOn(userRepository, 'findById').mockResolvedValue({
      id: 'owner-id',
      walletAddress: OWNER_ADDRESS,
    } as any);

    let result: any;
    try {
      result = await PropertyController.buyShares(PROPERTY_ID, {
        buyer: BUYER_ADDRESS,
        shares: 2,
      }, BUYER_ADDRESS);
    } catch (error: any) {
      console.error('BUY SHARES THREW ERROR:', error?.stack || error);
      throw error;
    }

    expect(result.transactionHash).toBe('a'.repeat(64));
    expect(result.newBalance).toBe(2);
    expect(mintParams).toEqual({
      contractId: CONTRACT_ID,
      adminPublicKey: ADMIN_PUBLIC_KEY,
      adminSecret: ADMIN_SECRET,
      sorobanPropertyId: 1,
      recipient: BUYER_ADDRESS,
      amount: 2,
    });
    expect(capturedInsert.hash).toBe('a'.repeat(64));
    expect(capturedInsert.status).toBe('confirmed');
  });

  it('does not persist a pending transaction when Soroban submission fails', async () => {
    (stellarService as any).getMintingConfig = () => ({
      contractId: CONTRACT_ID,
      adminPublicKey: ADMIN_PUBLIC_KEY,
      adminSecret: ADMIN_SECRET,
    });

    (stellarService as any).mintPropertyShares = async () => {
      throw new Error('Soroban submission failed');
    };

    let dbTransactionCalled = false;
    mockTxImpl = async () => {
      dbTransactionCalled = true;
      return { newBalance: 0 };
    };

    spyOn(propertyRepository, 'findById').mockResolvedValue({
      id: PROPERTY_ID,
      ownerId: OWNER_ADDRESS,
      availableShares: 10,
      pricePerShare: '100.00',
      tokenAddress: CONTRACT_ID,
      sorobanPropertyId: 1,
    } as any);

    spyOn(userRepository, 'getOrCreateByWallet').mockResolvedValue({
      id: 'buyer-id',
      walletAddress: BUYER_ADDRESS,
    } as any);

    spyOn(userRepository, 'findById').mockResolvedValue({
      id: 'owner-id',
      walletAddress: OWNER_ADDRESS,
    } as any);

    await expect(
      PropertyController.buyShares(PROPERTY_ID, { buyer: BUYER_ADDRESS, shares: 2 }, BUYER_ADDRESS),
    ).rejects.toThrow('Soroban submission failed');
    expect(dbTransactionCalled).toBe(false);
  });
});
