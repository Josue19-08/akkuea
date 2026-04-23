import { beforeEach, describe, expect, it } from 'bun:test';
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

let originalMintPropertyShares: typeof stellarService.mintPropertyShares;
let originalGetMintingConfig: typeof stellarService.getMintingConfig;
let originalDbTransaction: typeof db.transaction;
let originalPropertyFindById: typeof propertyRepository.findById;
let originalGetOrCreateByWallet: typeof userRepository.getOrCreateByWallet;
let originalUserFindById: typeof userRepository.findById;

beforeEach(() => {
  originalMintPropertyShares = stellarService.mintPropertyShares;
  originalGetMintingConfig = stellarService.getMintingConfig;
  originalDbTransaction = db.transaction;
  originalPropertyFindById = propertyRepository.findById;
  originalGetOrCreateByWallet = userRepository.getOrCreateByWallet;
  originalUserFindById = userRepository.findById;
});

afterEach(() => {
  stellarService.mintPropertyShares = originalMintPropertyShares;
  stellarService.getMintingConfig = originalGetMintingConfig;
  db.transaction = originalDbTransaction;
  propertyRepository.findById = originalPropertyFindById;
  userRepository.getOrCreateByWallet = originalGetOrCreateByWallet;
  userRepository.findById = originalUserFindById;
});

describe('PropertyController.buyShares', () => {
  it('submits a real Soroban transaction and returns the Horizon hash', async () => {
    let mintParams: Record<string, unknown> | null = null;

    stellarService.getMintingConfig = () => ({
      contractId: CONTRACT_ID,
      adminPublicKey: ADMIN_PUBLIC_KEY,
      adminSecret: ADMIN_SECRET,
    });

    stellarService.mintPropertyShares = async (params) => {
      mintParams = params as Record<string, unknown>;
      return {
        txHash: 'a'.repeat(64),
        contractId: params.contractId,
      };
    };

    db.transaction = async () => ({ newBalance: 42 });

    propertyRepository.findById = async () => ({
      id: PROPERTY_ID,
      ownerId: OWNER_ADDRESS,
      availableShares: 10,
      pricePerShare: '100.00',
      tokenAddress: CONTRACT_ID,
      sorobanPropertyId: 1,
    } as any);

    userRepository.getOrCreateByWallet = async (walletAddress) => ({
      id: 'buyer-id',
      walletAddress,
    } as any);

    userRepository.findById = async () => ({
      id: 'owner-id',
      walletAddress: OWNER_ADDRESS,
    } as any);

    const result = await PropertyController.buyShares(PROPERTY_ID, {
      buyer: BUYER_ADDRESS,
      shares: 2,
    }, BUYER_ADDRESS);

    expect(result.transactionHash).toBe('a'.repeat(64));
    expect(result.newBalance).toBe(42);
    expect(mintParams).toEqual({
      contractId: CONTRACT_ID,
      adminPublicKey: ADMIN_PUBLIC_KEY,
      adminSecret: ADMIN_SECRET,
      sorobanPropertyId: 1,
      recipient: BUYER_ADDRESS,
      amount: 2,
    });
  });

  it('does not persist a pending transaction when Soroban submission fails', async () => {
    stellarService.getMintingConfig = () => ({
      contractId: CONTRACT_ID,
      adminPublicKey: ADMIN_PUBLIC_KEY,
      adminSecret: ADMIN_SECRET,
    });

    stellarService.mintPropertyShares = async () => {
      throw new Error('Soroban submission failed');
    };

    let dbTransactionCalled = false;
    db.transaction = async () => {
      dbTransactionCalled = true;
      return { newBalance: 0 };
    };

    propertyRepository.findById = async () => ({
      id: PROPERTY_ID,
      ownerId: OWNER_ADDRESS,
      availableShares: 10,
      pricePerShare: '100.00',
      tokenAddress: CONTRACT_ID,
      sorobanPropertyId: 1,
    } as any);

    userRepository.getOrCreateByWallet = async () => ({
      id: 'buyer-id',
      walletAddress: BUYER_ADDRESS,
    } as any);

    userRepository.findById = async () => ({
      id: 'owner-id',
      walletAddress: OWNER_ADDRESS,
    } as any);

    await expect(
      PropertyController.buyShares(PROPERTY_ID, { buyer: BUYER_ADDRESS, shares: 2 }, BUYER_ADDRESS),
    ).rejects.toThrow('Soroban submission failed');
    expect(dbTransactionCalled).toBe(false);
  });
});
