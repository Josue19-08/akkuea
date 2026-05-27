//! ECS component keys for the PropertyNFT contract.
//!
//! Each property tile (entity) is identified by a `u32` ID.  Components are
//! stored in Soroban's **persistent** ledger storage under typed keys, which
//! mirrors the Cougr `SimpleWorld` storage layout:
//!
//! ```text
//! SimpleWorld: Map<(EntityId, Symbol), Bytes>
//! ```
//!
//! We use a Soroban `contracttype` enum to get the same type-safe, compact
//! encoding without pulling in the full ECS runtime.

use soroban_sdk::{contracttype, Address, Env, Vec};

// ---------------------------------------------------------------------------
// Storage key enum (Cougr SimpleWorld entity-component layout)
// ---------------------------------------------------------------------------

/// Persistent storage keys for each component of a property entity.
///
/// The variant naming convention is `<Component><EntityId>`, which maps to
/// the `(entity_id, component_symbol)` tuple used by Cougr's `SimpleWorld`.
#[contracttype]
#[derive(Clone)]
pub enum ComponentKey {
    /// Immutable (col, row) coordinates of a tile.
    Coordinates(u32),
    /// Current owner `Address` of a tile.
    Owner(u32),
    /// Current approved spender for a single-token approval.
    Approved(u32),
    /// Building / improvement tier (u32, default 0).
    ImprovementLevel(u32),
    /// Ledger sequence number of the last rental-income claim (u32).
    LastRentalClaim(u32),
    /// Reverse index: list of property IDs owned by an address.
    OwnerIndex(Address),
}

// ---------------------------------------------------------------------------
// Convenience constructors
// ---------------------------------------------------------------------------

#[inline]
pub fn coordinates_key(id: u32) -> ComponentKey {
    ComponentKey::Coordinates(id)
}

#[inline]
pub fn owner_key(id: u32) -> ComponentKey {
    ComponentKey::Owner(id)
}

#[inline]
pub fn approved_key(id: u32) -> ComponentKey {
    ComponentKey::Approved(id)
}

#[inline]
pub fn improvement_key(id: u32) -> ComponentKey {
    ComponentKey::ImprovementLevel(id)
}

#[inline]
pub fn last_rental_key(id: u32) -> ComponentKey {
    ComponentKey::LastRentalClaim(id)
}

// ---------------------------------------------------------------------------
// Owner index helpers (many-to-one reverse mapping)
// ---------------------------------------------------------------------------

/// Add `id` to the owner's index list.
pub fn owner_index_add(env: &Env, owner: &Address, id: u32) {
    let key = ComponentKey::OwnerIndex(owner.clone());
    let mut ids: Vec<u32> = env
        .storage()
        .persistent()
        .get(&key)
        .unwrap_or_else(|| Vec::new(env));

    // Avoid duplicates (should never happen, but defensive)
    for i in 0..ids.len() {
        if ids.get(i).unwrap_or(u32::MAX) == id {
            return;
        }
    }
    ids.push_back(id);
    env.storage().persistent().set(&key, &ids);
    crate::storage::bump_persistent(env, &key);
}

/// Remove `id` from the owner's index list.
pub fn owner_index_remove(env: &Env, owner: &Address, id: u32) {
    let key = ComponentKey::OwnerIndex(owner.clone());
    let ids: Vec<u32> = env
        .storage()
        .persistent()
        .get(&key)
        .unwrap_or_else(|| Vec::new(env));

    let mut new_ids: Vec<u32> = Vec::new(env);
    for i in 0..ids.len() {
        let v = ids.get(i).unwrap_or(u32::MAX);
        if v != id {
            new_ids.push_back(v);
        }
    }
    env.storage().persistent().set(&key, &new_ids);
    crate::storage::bump_persistent(env, &key);
}

/// Return all property IDs in the owner's index.
pub fn owner_index_list(env: &Env, owner: &Address) -> Vec<u32> {
    let key = ComponentKey::OwnerIndex(owner.clone());
    env.storage()
        .persistent()
        .get(&key)
        .unwrap_or_else(|| Vec::new(env))
}
