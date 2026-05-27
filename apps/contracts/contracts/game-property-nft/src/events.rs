//! Soroban contract events emitted by PropertyNFT.
//!
//! Every state-changing entry point emits a typed event.  The frontend
//! and the API indexer subscribe to these for real-time updates.

use soroban_sdk::{Address, Env, Symbol};

// ---------------------------------------------------------------------------
// Event topics
// ---------------------------------------------------------------------------

const TOPIC_CONTRACT: &str = "property_nft";

// ---------------------------------------------------------------------------
// transfer(from?, to, id)
// ---------------------------------------------------------------------------

/// Emitted on every ownership transfer, including initial mints.
///
/// For mints, `from` is `None`.
///
/// Topics:  [`"property_nft"`, `"transfer"`]
/// Data:    `{ from: Address | null, to: Address, id: u32 }`
pub fn emit_transfer(env: &Env, from: Option<&Address>, to: &Address, id: u32) {
    let topics = (
        Symbol::new(env, TOPIC_CONTRACT),
        Symbol::new(env, "transfer"),
    );
    match from {
        Some(f) => env.events().publish(topics, (f.clone(), to.clone(), id)),
        None => env.events().publish(topics, (to.clone(), id)),
    }
}

// ---------------------------------------------------------------------------
// approved(owner, spender, id)
// ---------------------------------------------------------------------------

/// Emitted when an approval is set for a single property.
///
/// Topics:  [`"property_nft"`, `"approved"`]
/// Data:    `{ owner: Address, spender: Address, id: u32 }`
pub fn emit_approved(env: &Env, owner: &Address, spender: &Address, id: u32) {
    let topics = (
        Symbol::new(env, TOPIC_CONTRACT),
        Symbol::new(env, "approved"),
    );
    env.events()
        .publish(topics, (owner.clone(), spender.clone(), id));
}

// ---------------------------------------------------------------------------
// initialized(deployer, treasury)
// ---------------------------------------------------------------------------

/// Emitted once when `initialize` completes successfully.
///
/// Topics:  [`"property_nft"`, `"initialized"`]
/// Data:    `{ deployer: Address, treasury: Address }`
pub fn emit_initialized(env: &Env, deployer: &Address, treasury: &Address) {
    let topics = (
        Symbol::new(env, TOPIC_CONTRACT),
        Symbol::new(env, "initialized"),
    );
    env.events()
        .publish(topics, (deployer.clone(), treasury.clone()));
}

// ---------------------------------------------------------------------------
// paused(by)
// ---------------------------------------------------------------------------

/// Emitted when the contract owner pauses the contract.
///
/// Topics:  [`"property_nft"`, `"paused"`]
/// Data:    `{ by: Address }`
pub fn emit_paused(env: &Env, by: &Address) {
    let topics = (
        Symbol::new(env, TOPIC_CONTRACT),
        Symbol::new(env, "paused"),
    );
    env.events().publish(topics, by.clone());
}

// ---------------------------------------------------------------------------
// unpaused(by)
// ---------------------------------------------------------------------------

/// Emitted when the contract owner resumes the contract.
///
/// Topics:  [`"property_nft"`, `"unpaused"`]
/// Data:    `{ by: Address }`
pub fn emit_unpaused(env: &Env, by: &Address) {
    let topics = (
        Symbol::new(env, TOPIC_CONTRACT),
        Symbol::new(env, "unpaused"),
    );
    env.events().publish(topics, by.clone());
}
