# Authentication Flow

Akkuea uses a secure Challenge-Response authentication mechanism to prevent impersonation and verify ownership of Stellar wallets. This replaces the legacy, insecure header-based authentication (`x-user-id` and `x-user-address`).

## Overview

The authentication process involves three steps:
1. **Challenge Request**: The client requests a unique, one-time nonce (challenge) for their Stellar wallet address.
2. **Signature**: The client signs the challenge using their Stellar private key (usually via a wallet integration like Freighter).
3. **Session Verification**: The client submits the signature back to the API. If valid, the API issues a JSON Web Token (JWT) representing an authenticated session.

Once authenticated, the client includes the JWT in the `Authorization` header as a Bearer token for all protected API requests.

---

## 1. Requesting a Challenge

Before signing anything, the client must obtain a nonce from the server.

### `POST /auth/challenge`

**Request Body:**
```json
{
  "walletAddress": "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
}
```

**Response:**
```json
{
  "nonce": "c8f...2a1"
}
```

The server temporarily stores this nonce (valid for 5 minutes) associated with the provided wallet address.

---

## 2. Signing the Challenge

Using the Stellar SDK or a compatible wallet provider (e.g., Freighter), the client signs the `nonce` string.

**Example using Stellar SDK (Node.js/Frontend):**
```javascript
import { Keypair } from '@stellar/stellar-sdk';

const keypair = Keypair.fromSecret('SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
const signatureBuffer = keypair.sign(Buffer.from(nonce));
const signatureHex = signatureBuffer.toString('hex');
```

---

## 3. Session Verification

The client submits the signature to exchange it for a JWT.

### `POST /auth/session`

**Request Body:**
```json
{
  "walletAddress": "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "signature": "hex_encoded_signature_string"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "walletAddress": "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "role": "USER"
  }
}
```

The server verifies the signature using the `walletAddress` (which is the public key). If valid, it returns a JWT valid for 24 hours.

---

## 4. Accessing Protected Routes

For any API endpoints that require authentication (e.g., creating a lending pool, accessing the user profile, marking notifications as read), you must include the JWT in the `Authorization` header.

**Header Format:**
```http
Authorization: Bearer <token>
```

**Example Request:**
```http
GET /users/me HTTP/1.1
Host: api.akkuea.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

If the token is missing, expired, or invalid, the API will respond with `401 Unauthorized`.

---

## Migration for Frontend Developers

- **Remove `x-user-id` and `x-user-address` headers**: These are no longer accepted or parsed by the API for authentication or rate-limiting.
- **Implement the Auth Flow**: Integrate the 3-step auth flow using the user's wallet extension on initial login.
- **Store the JWT**: Securely store the returned JWT (e.g., in memory or a secure cookie/storage) and attach it to the Axios/Fetch instance as the `Authorization: Bearer <token>` header for subsequent requests.
