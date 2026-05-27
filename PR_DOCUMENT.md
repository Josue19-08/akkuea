# PR: chore(api): upgrade drizzle-orm to ^0.45.2 and drizzle-kit to ^0.31.10 — Security upgrade

## Summary

Upgrade Drizzle ORM to address a high-severity SQL identifier escaping vulnerability and move `drizzle-kit` to a stable release. Also fix resulting TypeScript typing break in repository helpers.

## Motivation

Dependabot flagged an SQL injection vulnerability in `drizzle-orm@0.38.4`. The issue is resolved in `drizzle-orm@0.45.2`. Upgrading removes the vulnerability and brings the ORM to a maintained release series. `drizzle-kit` was pinned to a beta — moving to a stable tag prevents future resolution issues.

## Changes

- Bumped `drizzle-orm` to `^0.45.2`
- Updated `drizzle-kit` to `^0.31.10` (stable)
- Regenerated lockfile and installed deps for `apps/api`
- Fixed TypeScript typing break in repository base class to satisfy Drizzle 0.45

Files changed:
- `apps/api/package.json`
- `apps/api/src/repositories/BaseRepository.ts`
- Bun lockfile regenerated in `apps/api`

## Implementation note

To keep changes minimal and unblock CI quickly, `BaseRepository.ts` uses a narrow `any` cast for `this.table` at `select().from(...)` calls:

- Reason: Drizzle 0.45 introduced stricter generic/type constraints on table-like values used in `select().from(...)`, causing compile errors across generic repository code.
- Short-term fix: cast `this.table as any` for the affected `select` calls to satisfy the new typings without refactoring every repository.
- Recommended follow-up: replace `any` by properly typing table types or refactoring repository methods to use typed query builders.

## Testing performed

Locally I ran:

```bash
cd apps/api
export PATH="$HOME/.bun/bin:$PATH"
bun install
bun run type-check
bun run test:ci
```

Result summary:

- `bun run type-check`: PASSED
- `bun run test:ci`: 181 passed, 57 skipped, 0 failed
- 57 skipped tests were integration tests requiring `DATABASE_URL`, Soroban endpoints, or other infra.

## Acceptance criteria

- [x] `drizzle-orm` version in `apps/api/package.json` is `^0.45.2` or higher.
- [x] `drizzle-kit` updated to a stable, non-beta release (`^0.31.10`).
- [x] Dependencies installed and lockfile regenerated locally.
- [x] `bun run type-check` passes in `apps/api`.
- [x] All existing API tests pass locally.
- [ ] CI workflows must pass on PR.

## How to validate locally

```bash
cd apps/api
export PATH="$HOME/.bun/bin:$PATH"
bun install
bun run type-check
bun run test:ci
```

## Notes

- Runtime behavior was not intentionally changed; the fix is focused on dependency upgrade and typing compatibility.
- Please run GitHub Actions CI to verify the PR in the target environment.

## PR Body suggestion

Upgrade `drizzle-orm` to ^0.45.2 to resolve a Dependabot-reported SQL identifier escaping vulnerability and update `drizzle-kit` to a stable release (^0.31.10). Regenerated the Bun lockfile and fixed Drizzle 0.45 TypeScript typing issues in `BaseRepository`.
