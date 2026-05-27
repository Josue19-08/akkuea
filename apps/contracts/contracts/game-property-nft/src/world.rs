//! ECS world query helpers.
//!
//! `PropertyState` is the aggregate view of all components for a single
//! property entity, returned by the `get_property` entry point.

use soroban_sdk::{contracttype, Address, Env};

use crate::components::{
    approved_key, coordinates_key, improvement_key, last_rental_key, owner_key,
};

// ---------------------------------------------------------------------------
// Aggregate return type (Cougr world query result)
// ---------------------------------------------------------------------------

/// Full state of a property tile, assembled from its ECS components.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PropertyState {
    /// Property entity ID (0 … 399).
    pub id: u32,
    /// Grid column (0 … 19).
    pub col: u8,
    /// Grid row (0 … 19).
    pub row: u8,
    /// Current owner address.
    pub owner: Address,
    /// Building / improvement tier (default 0).
    pub improvement_level: u32,
    /// Ledger sequence of the last rental-income claim.
    pub last_rental_claim: u32,
    /// Current approved spender, if any.
    pub approved: Option<Address>,
}

// ---------------------------------------------------------------------------
// Loader
// ---------------------------------------------------------------------------

/// Read all components for entity `id` and return them as a `PropertyState`.
///
/// # Panics
///
/// Panics via `panic_with_error!` if the owner component is missing (contract
/// not initialized).  Other components fall back to defaults.
pub fn load_property(env: &Env, id: u32) -> PropertyState {
    let (col, row): (u8, u8) = env
        .storage()
        .persistent()
        .get(&coordinates_key(id))
        .unwrap_or((0, 0));

    let owner: Address = env
        .storage()
        .persistent()
        .get(&owner_key(id))
        .unwrap_or_else(|| soroban_sdk::panic_with_error!(env, crate::errors::GameError::PropertyNotFound));

    let improvement_level: u32 = env
        .storage()
        .persistent()
        .get(&improvement_key(id))
        .unwrap_or(0);

    let last_rental_claim: u32 = env
        .storage()
        .persistent()
        .get(&last_rental_key(id))
        .unwrap_or(0);

    let approved: Option<Address> = env.storage().persistent().get(&approved_key(id));

    PropertyState {
        id,
        col,
        row,
        owner,
        improvement_level,
        last_rental_claim,
        approved,
    }
}
