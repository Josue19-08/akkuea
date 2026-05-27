//! Ledger TTL bump helpers for Soroban storage entries.
//!
//! Soroban persistent entries expire unless their TTL is extended.  We bump
//! on every write so entries stay live for the maximum allowed period.

use soroban_sdk::Env;

use crate::components::ComponentKey;
use crate::ownable::InstanceKey;

// ---------------------------------------------------------------------------
// TTL constants (in ledgers)
// ---------------------------------------------------------------------------

/// Bump instance storage this many ledgers on every write.
/// ~30 days at ~6-second ledger close time.
pub const INSTANCE_BUMP_AMOUNT: u32 = 518_400;

/// Bump persistent entries this many ledgers on every write.
/// ~365 days.
pub const LEDGER_BUMP_AMOUNT: u32 = 6_307_200;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/// Extend the TTL of the contract instance entry.
pub fn bump_instance(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_BUMP_AMOUNT, INSTANCE_BUMP_AMOUNT);
}

/// Extend the TTL of a persistent component entry.
pub fn bump_persistent(env: &Env, key: &ComponentKey) {
    env.storage()
        .persistent()
        .extend_ttl(key, LEDGER_BUMP_AMOUNT, LEDGER_BUMP_AMOUNT);
}
