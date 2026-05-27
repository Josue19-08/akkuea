//! Ownable standard (Cougr-compatible).
//!
//! The deploying account is the *contract owner*.  It is stored in
//! **instance** storage under `InstanceKey::ContractOwner`.
//!
//! `initialize` is guarded by a one-shot flag (`InstanceKey::Initialized`).
//! Once set, any subsequent call to `initialize` panics with
//! `GameError::AlreadyInitialized`.

use soroban_sdk::{contracttype, panic_with_error, Address, Env};

use crate::errors::GameError;

// ---------------------------------------------------------------------------
// Instance storage keys for Ownable
// ---------------------------------------------------------------------------

#[contracttype]
#[derive(Clone)]
pub enum InstanceKey {
    /// Set to `true` after `initialize` completes.
    Initialized,
    /// The address that deployed and owns the contract.
    ContractOwner,
    /// Pausable flag.
    Paused,
}

// ---------------------------------------------------------------------------
// One-shot initializer guard
// ---------------------------------------------------------------------------

/// Panic with `AlreadyInitialized` if the contract has already been set up.
pub fn assert_not_initialized(env: &Env) {
    if is_initialized(env) {
        panic_with_error!(env, GameError::AlreadyInitialized);
    }
}

/// Record that initialization has occurred and store the owner.
pub fn mark_initialized(env: &Env, owner: &Address) {
    env.storage()
        .instance()
        .set(&InstanceKey::Initialized, &true);
    env.storage()
        .instance()
        .set(&InstanceKey::ContractOwner, owner);
}

/// Return `true` if `initialize` has been called.
pub fn is_initialized(env: &Env) -> bool {
    env.storage()
        .instance()
        .get::<_, bool>(&InstanceKey::Initialized)
        .unwrap_or(false)
}

// ---------------------------------------------------------------------------
// Owner enforcement
// ---------------------------------------------------------------------------

/// Panic with `NotContractOwner` if `caller` is not the stored owner.
pub fn assert_owner(env: &Env, caller: &Address) {
    let owner: Option<Address> = env
        .storage()
        .instance()
        .get(&InstanceKey::ContractOwner);
    match owner {
        Some(ref o) if o == caller => {}
        _ => panic_with_error!(env, GameError::NotContractOwner),
    }
}
