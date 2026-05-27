#![no_std]

//! # PropertyNFT – Akkuea Land Ownership Contract
//!
//! Each of the 400 property tiles in Akkuea Land is a non-fungible token
//! identified by its (col, row) grid coordinates.  This contract is the
//! foundational ownership layer consumed by `GameMarketplace` and
//! `GameEngine`.
//!
//! ## Architecture (Cougr-inspired ECS)
//!
//! Properties are stored as ECS *entities*.  Each entity is an integer ID
//! (`u32`) and carries four *components* persisted in Soroban's persistent
//! ledger storage:
//!
//! | Component          | Type        | Description                                   |
//! |--------------------|-------------|-----------------------------------------------|
//! | `Coordinates`      | `(u8, u8)`  | Immutable (col, row) pair, 0-based            |
//! | `Owner`            | `Address`   | Current owner                                  |
//! | `ImprovementLevel` | `u32`       | Building / improvement tier (default 0)        |
//! | `LastRentalClaim`  | `u32`       | Ledger sequence of last rental-income claim    |
//!
//! Ownership-transfer approval uses a separate component:
//!
//! | Component  | Type      | Description                                       |
//! |------------|-----------|---------------------------------------------------|
//! | `Approved` | `Address` | Single-token approval (marketplace escrow pattern)|
//!
//! ## Standards (Cougr-compatible)
//!
//! * **Ownable** – `initialize` is one-shot, protected by an initialized flag.
//!   The deploying account becomes the *contract owner* stored in instance
//!   storage; it is the only address that may call `initialize`.
//! * **Pausable** – The contract owner may call `pause` / `unpause` to halt /
//!   resume all transfer operations in an emergency.

mod components;
mod errors;
mod events;
mod ownable;
mod pausable;
mod storage;
mod world;

pub use errors::GameError;
pub use world::PropertyState;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contractimpl, panic_with_error, Address, Env, Vec};

use components::{
    approved_key, coordinates_key, improvement_key, last_rental_key, owner_key,
    owner_index_remove, owner_index_add, owner_index_list,
};
use errors::GameError as Err;
use events::{
    emit_approved, emit_initialized, emit_paused, emit_transfer, emit_unpaused,
};
use ownable::{assert_owner, assert_not_initialized, mark_initialized};
use pausable::{assert_not_paused};
use storage::{INSTANCE_BUMP_AMOUNT, LEDGER_BUMP_AMOUNT};

// ---------------------------------------------------------------------------
// Grid constants
// ---------------------------------------------------------------------------

/// Total number of property tiles in the game (20 × 20 grid).
pub const TOTAL_TILES: u32 = 400;
/// Number of columns in the grid.
pub const GRID_COLS: u8 = 20;
/// Number of rows in the grid.
pub const GRID_ROWS: u8 = 20;

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

#[contract]
pub struct PropertyNFT;

#[contractimpl]
impl PropertyNFT {
    // -----------------------------------------------------------------------
    // Admin / Lifecycle
    // -----------------------------------------------------------------------

    /// Mint all 400 tiles to `treasury`.
    ///
    /// May only be called once by the deployer (Ownable one-shot).
    /// Emits `initialized` + 400 `transfer` (mint) events.
    pub fn initialize(env: Env, deployer: Address, treasury: Address) {
        deployer.require_auth();
        assert_not_initialized(&env);
        mark_initialized(&env, &deployer);

        storage::bump_instance(&env);

        for id in 0u32..TOTAL_TILES {
            let col = (id % GRID_COLS as u32) as u8;
            let row = (id / GRID_COLS as u32) as u8;

            // Set coordinates component (immutable after mint)
            env.storage()
                .persistent()
                .set(&coordinates_key(id), &(col, row));
            storage::bump_persistent(&env, &coordinates_key(id));

            // Set owner component
            env.storage()
                .persistent()
                .set(&owner_key(id), &treasury);
            storage::bump_persistent(&env, &owner_key(id));

            // Set improvement level to 0
            env.storage()
                .persistent()
                .set(&improvement_key(id), &0u32);
            storage::bump_persistent(&env, &improvement_key(id));

            // Set last rental claim ledger to current
            let ledger = env.ledger().sequence();
            env.storage()
                .persistent()
                .set(&last_rental_key(id), &ledger);
            storage::bump_persistent(&env, &last_rental_key(id));

            // Update owner → [property_ids] index
            owner_index_add(&env, &treasury, id);

            emit_transfer(&env, None, &treasury, id);
        }

        emit_initialized(&env, &deployer, &treasury);
    }

    /// Transfer property `id` from `from` to `to`.
    ///
    /// Caller must be `from` (the current owner).
    /// Clears any existing approval.
    /// Panics when paused.
    pub fn transfer(env: Env, from: Address, to: Address, id: u32) {
        from.require_auth();
        assert_not_paused(&env);
        Self::assert_valid_id(&env, id);

        let owner: Address = Self::require_owner(&env, id);
        if owner != from {
            panic_with_error!(&env, Err::NotOwner);
        }

        Self::do_transfer(&env, &from, &to, id);
    }

    /// Approve `spender` to transfer property `id` on behalf of `owner`.
    ///
    /// Caller must be `owner`.  Pass the zero/none pattern by omitting or by
    /// explicitly calling with the current address to clear (marketplace
    /// integrations call `approve` with escrow address, then `transfer_from`).
    pub fn approve(env: Env, owner: Address, spender: Address, id: u32) {
        owner.require_auth();
        assert_not_paused(&env);
        Self::assert_valid_id(&env, id);

        let current_owner: Address = Self::require_owner(&env, id);
        if current_owner != owner {
            panic_with_error!(&env, Err::NotOwner);
        }

        env.storage()
            .persistent()
            .set(&approved_key(id), &spender);
        storage::bump_persistent(&env, &approved_key(id));

        emit_approved(&env, &owner, &spender, id);
    }

    /// Transfer property `id` from `from` to `to` using a prior approval.
    ///
    /// Caller must be the approved spender for `id`.
    /// Clears the approval after transfer.
    /// Panics when paused.
    pub fn transfer_from(env: Env, spender: Address, from: Address, to: Address, id: u32) {
        spender.require_auth();
        assert_not_paused(&env);
        Self::assert_valid_id(&env, id);

        let owner: Address = Self::require_owner(&env, id);
        if owner != from {
            panic_with_error!(&env, Err::NotOwner);
        }

        let approved: Option<Address> = env.storage().persistent().get(&approved_key(id));
        match approved {
            Some(ref ap) if ap == &spender => {}
            _ => panic_with_error!(&env, Err::NotApproved),
        }

        Self::do_transfer(&env, &from, &to, id);
    }

    // -----------------------------------------------------------------------
    // Pausable (owner-only)
    // -----------------------------------------------------------------------

    /// Halt all transfers in an emergency.  Only callable by contract owner.
    pub fn pause(env: Env, caller: Address) {
        caller.require_auth();
        assert_owner(&env, &caller);
        pausable::pause(&env);
        emit_paused(&env, &caller);
    }

    /// Resume transfers.  Only callable by contract owner.
    pub fn unpause(env: Env, caller: Address) {
        caller.require_auth();
        assert_owner(&env, &caller);
        pausable::unpause(&env);
        emit_unpaused(&env, &caller);
    }

    // -----------------------------------------------------------------------
    // Queries
    // -----------------------------------------------------------------------

    /// Return full property state for tile `id`.
    pub fn get_property(env: Env, id: u32) -> PropertyState {
        Self::assert_valid_id(&env, id);
        world::load_property(&env, id)
    }

    /// Return current owner of tile `id`.
    pub fn get_owner(env: Env, id: u32) -> Address {
        Self::assert_valid_id(&env, id);
        Self::require_owner(&env, id)
    }

    /// Return all property IDs owned by `owner`.
    pub fn list_by_owner(env: Env, owner: Address) -> Vec<u32> {
        owner_index_list(&env, &owner)
    }

    /// Return whether the contract is paused.
    pub fn is_paused(env: Env) -> bool {
        pausable::is_paused(&env)
    }

    /// Return whether the contract has been initialized.
    pub fn is_initialized(env: Env) -> bool {
        ownable::is_initialized(&env)
    }

    // -----------------------------------------------------------------------
    // Internal helpers
    // -----------------------------------------------------------------------

    fn assert_valid_id(env: &Env, id: u32) {
        if id >= TOTAL_TILES {
            panic_with_error!(env, Err::InvalidPropertyId);
        }
    }

    fn require_owner(env: &Env, id: u32) -> Address {
        env.storage()
            .persistent()
            .get::<_, Address>(&owner_key(id))
            .unwrap_or_else(|| panic_with_error!(env, Err::PropertyNotFound))
    }

    /// Core transfer logic: update owner component, owner index, clear
    /// approval, and emit event.
    fn do_transfer(env: &Env, from: &Address, to: &Address, id: u32) {
        // Update owner component
        env.storage().persistent().set(&owner_key(id), to);
        storage::bump_persistent(env, &owner_key(id));

        // Clear approval
        env.storage().persistent().remove(&approved_key(id));

        // Update owner index
        owner_index_remove(env, from, id);
        owner_index_add(env, to, id);

        emit_transfer(env, Some(from), to, id);
    }
}
