//! Pausable standard (Cougr-compatible).
//!
//! The paused flag is stored in **instance** storage so it is always
//! available at low ledger cost.  Only the contract owner (enforced by
//! the caller in `lib.rs`) may flip the flag.

use soroban_sdk::{panic_with_error, Env};

use crate::errors::GameError;
use crate::ownable::InstanceKey;

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/// Return `true` if the contract is currently paused.
pub fn is_paused(env: &Env) -> bool {
    env.storage()
        .instance()
        .get::<_, bool>(&InstanceKey::Paused)
        .unwrap_or(false)
}

// ---------------------------------------------------------------------------
// Guard
// ---------------------------------------------------------------------------

/// Panic with `ContractPaused` if the contract is paused.
pub fn assert_not_paused(env: &Env) {
    if is_paused(env) {
        panic_with_error!(env, GameError::ContractPaused);
    }
}

// ---------------------------------------------------------------------------
// Mutate (owner enforced by caller)
// ---------------------------------------------------------------------------

/// Set the paused flag.
pub fn pause(env: &Env) {
    env.storage()
        .instance()
        .set(&InstanceKey::Paused, &true);
}

/// Clear the paused flag.
pub fn unpause(env: &Env) {
    env.storage()
        .instance()
        .remove(&InstanceKey::Paused);
}
