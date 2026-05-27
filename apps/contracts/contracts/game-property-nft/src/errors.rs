//! Typed `GameError` enum used with `panic_with_error!`.

use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum GameError {
    /// Caller is not the current owner of the property.
    NotOwner = 1,
    /// Caller is not the approved spender for the property.
    NotApproved = 2,
    /// Property ID is outside the valid range [0, 400).
    InvalidPropertyId = 3,
    /// Property entity does not exist (contract not initialized).
    PropertyNotFound = 4,
    /// `initialize` has already been called.
    AlreadyInitialized = 5,
    /// Caller is not the contract owner (Ownable).
    NotContractOwner = 6,
    /// Contract is paused.
    ContractPaused = 7,
}
