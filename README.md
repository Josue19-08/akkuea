<div align="center">

# Akkuea

**Real Estate Tokenization & DeFi Lending on the Stellar Blockchain**

[![Monorepo CI](https://github.com/akkuea/akkuea/actions/workflows/monorepo-ci.yml/badge.svg)](https://github.com/akkuea/akkuea/actions/workflows/monorepo-ci.yml)
[![API CI](https://github.com/akkuea/akkuea/actions/workflows/api-ci.yml/badge.svg)](https://github.com/akkuea/akkuea/actions/workflows/api-ci.yml)
[![Webapp CI](https://github.com/akkuea/akkuea/actions/workflows/webapp-ci.yml/badge.svg)](https://github.com/akkuea/akkuea/actions/workflows/webapp-ci.yml)
[![Contracts CI](https://github.com/akkuea/akkuea/actions/workflows/contracts-ci.yml/badge.svg)](https://github.com/akkuea/akkuea/actions/workflows/contracts-ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Akkuea is an institutional-grade platform that bridges traditional real estate with decentralized finance. Property owners can tokenize real-world assets as on-chain shares, and investors can use those shares as collateral to access DeFi lending pools - all on Stellar's high-throughput, low-cost network.

[Getting Started](#getting-started) · [Architecture](#architecture) · [Tech Stack](#tech-stack) · [Contributing](CONTRIBUTING.md) · [Docs](docs/)

</div>

---

## Overview

Akkuea solves two tightly coupled problems in the intersection of real estate and DeFi:

1. **Illiquidity of real estate.** Tokenizing property into fractional on-chain shares makes it possible to trade, transfer, and leverage real-world assets with the same programmability as any blockchain token.

2. **Collateral limitations in DeFi.** By accepting tokenized real estate as collateral, Akkuea unlocks lending capacity backed by tangible, regulated assets rather than purely speculative crypto positions.

The platform is built to meet institutional compliance requirements (KYC/AML on-chain, role-based access, audit trails) while remaining open and composable for DeFi participants.

---

## Features

### Real Estate Tokenization

- Fractional share ownership of individual properties, tracked entirely on-chain
- KYC/AML compliance enforced at the smart contract level
- Minting and burning controls with role-gated admin operations
- Property metadata storage with immutable audit history

### DeFi Lending Protocol

- Collateralized borrowing using tokenized real estate shares
- Privacy-configurable lending pools for institutional participants
- Automated interest calculation and liquidation mechanisms
- Oracle-integrated asset valuation for accurate collateral ratios

### Compliance & Security

- Wallet-based authentication via Stellar signatures - no passwords, no centralized auth
- Role-based access control across admin, operator, and user tiers
- Webhook signature verification for all external integrations
- Rate limiting, input sanitization, and structured audit logging throughout the API

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         Akkuea Platform                          │
│                                                                  │
│  ┌─────────────────┐   ┌─────────────────┐   ┌───────────────┐  │
│  │   Web Frontend  │   │   Backend API   │   │Smart Contracts│  │
│  │  Next.js + React│◄──►│  Elysia / Bun  │◄──►│  Soroban/Rust │  │
│  │  localhost:3000 │   │  localhost:3001 │   │Stellar Network│  │
│  └────────┬────────┘   └────────┬────────┘   └───────────────┘  │
│           │                     │                                │
│           └──────────┬──────────┘                               │
│                      ▼                                           │
│            ┌──────────────────┐                                  │
│            │  Shared Library  │                                  │
│            │ Types · Utils    │                                  │
│            │ Validation · SDK │                                  │
│            └──────────────────┘                                  │
└──────────────────────────────────────────────────────────────────┘
```

The repository is a **Bun monorepo** with four workspaces:

| Workspace        | Path             | Role                                                               |
| ---------------- | ---------------- | ------------------------------------------------------------------ |
| `@akkuea/webapp` | `apps/webapp`    | Next.js 16 frontend with React 19                                  |
| `@akkuea/api`    | `apps/api`       | Elysia REST API running on Bun                                     |
| `@akkuea/shared` | `apps/shared`    | Types, utilities, and Stellar SDK helpers shared across workspaces |
| Contracts        | `apps/contracts` | Soroban smart contracts written in Rust                            |

### Data Flows

**Property Tokenization**

```
User submits property → Frontend validates → API verifies KYC
→ Soroban contract mints shares → Event emitted → API indexes
→ Frontend reflects updated portfolio
```

**DeFi Borrowing**

```
User requests loan → Frontend calculates available collateral
→ API checks on-chain share balance → Contract validates collateral ratio
→ Contract disburses funds → Frontend updates lending position
```

---

## Tech Stack

| Layer                  | Technology                                                      |
| ---------------------- | --------------------------------------------------------------- |
| **Frontend**           | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Zustand, Zod  |
| **Backend API**        | Elysia, Bun runtime, TypeScript, Drizzle ORM, Zod               |
| **Database**           | PostgreSQL (Drizzle migrations), Redis (optional caching layer) |
| **Smart Contracts**    | Rust, Soroban SDK 25, WASM compilation target                   |
| **Blockchain**         | Stellar (Testnet / Mainnet), Horizon REST API, Soroban RPC      |
| **Wallet Integration** | `@creit.tech/stellar-wallets-kit`                               |
| **Testing**            | `bun test`, `@testing-library/react`                            |
| **CI/CD**              | GitHub Actions (5 independent workflow files)                   |
| **Tooling**            | Bun 1.2+, ESLint 9, Prettier, Concurrently                      |

---

## Getting Started

### Prerequisites

| Tool                                                                                     | Version       | Notes                                  |
| ---------------------------------------------------------------------------------------- | ------------- | -------------------------------------- |
| [Bun](https://bun.sh)                                                                    | 1.2+          | Primary runtime and package manager    |
| [Node.js](https://nodejs.org)                                                            | 18+           | Required by some tooling               |
| [Rust](https://rustup.rs)                                                                | latest stable | Required only for contract development |
| [Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools/cli/stellar-cli) | latest        | Required for contract deployment       |
| [Git](https://git-scm.com)                                                               | any           | Version control                        |

### Installation

```bash
# 1. Fork and clone the repository (see CONTRIBUTING.md for the fork workflow)
git clone https://github.com/<your-username>/akkuea.git
cd akkuea

# 2. Install all workspace dependencies
bun run install:all

# 3. Configure environment variables
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your values (see docs/deployment/environment-variables.md)
```

### Running the Platform Locally

```bash
# Start both frontend and API in parallel
bun run dev

# Or run each workspace individually
bun run dev:webapp   # → http://localhost:3000
bun run dev:api      # → http://localhost:3001
```

Verify your setup:

- **Frontend** - visit `http://localhost:3000`
- **API health** - visit `http://localhost:3001/health`
- **API docs (Swagger)** - visit `http://localhost:3001/swagger`

### Smart Contract Development

```bash
cd apps/contracts

# Build contracts (WASM output)
cargo build --target wasm32-unknown-unknown --release

# Run contract unit tests
cargo test
```

For deploying contracts to Stellar Testnet, see [`docs/deployment/deploy-contracts.md`](docs/deployment/deploy-contracts.md).

---

## Available Scripts

Run from the repository root:

| Script                     | Description                                    |
| -------------------------- | ---------------------------------------------- |
| `bun run dev`              | Start frontend and API concurrently            |
| `bun run build`            | Build all workspaces                           |
| `bun run test`             | Run all workspace test suites                  |
| `bun run lint`             | Lint all workspaces                            |
| `bun run typecheck`        | Type-check all workspaces                      |
| `bun run format`           | Format all files with Prettier                 |
| `bun run clean`            | Remove all build artifacts and `node_modules`  |
| `bun run build:contracts`  | Build Soroban contracts via `scripts/build.sh` |
| `bun run deploy:contracts` | Deploy contracts via `scripts/deploy.sh`       |

---

## Environment Variables

All required environment variables are documented in [`docs/deployment/environment-variables.md`](docs/deployment/environment-variables.md). The source of truth is `apps/api/.env.example`.

Key categories:

- **Database** - PostgreSQL connection string and pool settings
- **API Server** - Port, environment, log level
- **Security** - Webhook secret, operations credential, allowed admin wallets
- **Stellar / Soroban** - Horizon URL, RPC URL, network passphrase, admin keypair, contract IDs
- **KYC** - Upload directory for compliance documents

> **Security note:** Never commit `.env` files. `STELLAR_ADMIN_SECRET` is a root credential - treat it like a private key and load it from a secrets manager in production.

---

## CI/CD

Akkuea runs five independent GitHub Actions workflows on every push and pull request to `main` and `develop`:

| Workflow  | File               | Checks                                                                                                |
| --------- | ------------------ | ----------------------------------------------------------------------------------------------------- |
| Monorepo  | `monorepo-ci.yml`  | Workspace integrity, dependency audit, bundle sizes, cross-workspace integration, security compliance |
| API       | `api-ci.yml`       | Lint, type-check, unit tests, build                                                                   |
| Webapp    | `webapp-ci.yml`    | Lint, type-check, unit tests, build                                                                   |
| Shared    | `shared-ci.yml`    | Lint, type-check, build                                                                               |
| Contracts | `contracts-ci.yml` | Rust format, Clippy, unit tests, WASM build                                                           |

All five workflows must pass before any pull request can be merged.

---

## Project Structure

```
akkuea/
├── apps/
│   ├── api/              # Elysia/Bun backend API
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── repositories/
│   │   │   ├── routes/
│   │   │   ├── middleware/
│   │   │   ├── db/
│   │   │   └── workers/
│   │   └── drizzle/      # Database migrations
│   ├── webapp/           # Next.js frontend
│   │   └── src/
│   │       ├── app/      # App Router pages and layouts
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── services/
│   │       └── types/
│   ├── contracts/        # Soroban smart contracts (Rust)
│   │   └── contracts/
│   │       └── defi-rwa/
│   └── shared/           # Shared TypeScript library
├── docs/
│   ├── api/              # API endpoint documentation
│   ├── architecture/     # System design documents
│   ├── deployment/       # Deployment and environment guides
│   ├── guides/           # Developer getting-started guides
│   ├── operations/       # Runbooks for production operations
│   └── testing/          # Testing strategy and smoke tests
├── scripts/              # Build and deployment shell scripts
└── .github/
    └── workflows/        # GitHub Actions CI definitions
```

---

## Documentation

| Document                                                                               | Description                             |
| -------------------------------------------------------------------------------------- | --------------------------------------- |
| [`docs/guides/getting-started.md`](docs/guides/getting-started.md)                     | Full local setup walkthrough            |
| [`docs/architecture/system-architecture.md`](docs/architecture/system-architecture.md) | System design and component breakdown   |
| [`docs/deployment/environment-variables.md`](docs/deployment/environment-variables.md) | Complete environment variable reference |
| [`docs/deployment/deploy-contracts.md`](docs/deployment/deploy-contracts.md)           | Contract deployment to Stellar networks |
| [`docs/api/overview.md`](docs/api/overview.md)                                         | API overview and authentication         |
| [`docs/api/minting-workflow.md`](docs/api/minting-workflow.md)                         | Property tokenization API flow          |
| [`docs/api/kyc-workflow.md`](docs/api/kyc-workflow.md)                                 | KYC verification API flow               |
| [`CONTRIBUTING.md`](CONTRIBUTING.md)                                                   | Contribution workflow and standards     |

---

## Contributing

We welcome contributions. Akkuea uses a **fork-based workflow** - all changes must come through a fork and pull request. No direct pushes to `main` or `develop`.

Read the full contribution guide before submitting your first pull request: **[CONTRIBUTING.md](CONTRIBUTING.md)**

---

## License

[MIT](LICENSE) - Acachete Labs
