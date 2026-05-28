Integrated a typed Soroban contract layer for the shared package and refactored the API Stellar service to use it for ABI-backed contract invocations.

What changed:
- Added shared Soroban client configuration utilities, including a Node signer helper for server-side transaction signing.
- Added a generated typed client for the current combined `rwa-defi` Soroban contract using the local Stellar CLI contract bindings against the compiled WASM ABI.
- Added two shared domain wrappers in `apps/shared/src/contracts/`:
  - `RealEstateTokenContractClient`
  - `DefiLendingContractClient`
- Exported the new contract clients from `apps/shared/src/index.ts`.
- Refactored `apps/api/src/services/StellarService.ts` so ABI-known contract methods now build and submit transactions through the typed shared clients instead of only using raw `stellar-sdk` contract calls.
- Kept a narrow legacy fallback for methods that are still referenced in the API but are not part of the current on-chain contract ABI.

Why this was done:
- Reduce raw Soroban invocation boilerplate in the API.
- Centralize contract method typing in the shared package so the API and webapp can use the same interface.
- Align the client surface with the actual compiled contract ABI rather than relying on handwritten method assumptions.

Branch notes:
- The current Rust contract and deployment docs describe a single combined Soroban contract, so the token and lending clients are implemented as typed domain wrappers over the same underlying contract ID.
- The branch was pushed to:
  - `origin/codex/issue-830-typed-soroban-clients`
