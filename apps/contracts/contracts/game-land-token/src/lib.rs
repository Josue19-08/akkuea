#![no_std]

use soroban_sdk::{contract, contracterror, contractimpl, panic_with_error, Address, Env, String};

#[contracterror]
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum TokenError {
    AlreadyInitialized = 1,
    InsufficientBalance = 2,
    InsufficientAllowance = 3,
    FaucetDisabled = 4,
    FaucetAlreadyClaimed = 5,
    Unauthorized = 6,
}

#[soroban_sdk::contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Balance(Address),
    Allowance(Address, Address), // (from, spender)
    Admin,
    Testnet,
    Authorized(Address),
    FaucetClaimed(Address),
}

#[contract]
pub struct GameLandToken;

#[contractimpl]
impl GameLandToken {
    pub fn initialize(env: Env, admin: Address, testnet_mode: bool) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic_with_error!(&env, TokenError::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::Testnet, &testnet_mode);
        // By default, admin is authorized to mint/manage
        env.storage()
            .instance()
            .set(&DataKey::Authorized(admin), &true);
    }

    pub fn mint(env: Env, caller: Address, to: Address, amount: i128) {
        caller.require_auth();

        // safe: storage is always set during initialize; panics on uninitialized contract
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        let is_authorized = caller == admin || Self::authorized(env.clone(), caller.clone());
        if !is_authorized {
            panic_with_error!(&env, TokenError::Unauthorized);
        }

        let balance = Self::balance(env.clone(), to.clone());
        env.storage()
            .persistent()
            .set(&DataKey::Balance(to.clone()), &(balance + amount));

        let key = DataKey::Balance(to);
        env.storage()
            .persistent()
            .extend_ttl(&key, 518_400, 518_400);
    }

    pub fn burn(env: Env, from: Address, amount: i128) {
        from.require_auth();
        let balance = Self::balance(env.clone(), from.clone());
        if balance < amount {
            panic_with_error!(&env, TokenError::InsufficientBalance);
        }
        env.storage()
            .persistent()
            .set(&DataKey::Balance(from.clone()), &(balance - amount));

        let key = DataKey::Balance(from);
        env.storage()
            .persistent()
            .extend_ttl(&key, 518_400, 518_400);
    }

    pub fn burn_from(env: Env, spender: Address, from: Address, amount: i128) {
        spender.require_auth();
        let allowance = Self::allowance(env.clone(), from.clone(), spender.clone());
        if allowance < amount {
            panic_with_error!(&env, TokenError::InsufficientAllowance);
        }
        let balance = Self::balance(env.clone(), from.clone());
        if balance < amount {
            panic_with_error!(&env, TokenError::InsufficientBalance);
        }

        env.storage().persistent().set(
            &DataKey::Allowance(from.clone(), spender.clone()),
            &(allowance - amount),
        );
        env.storage()
            .persistent()
            .set(&DataKey::Balance(from.clone()), &(balance - amount));

        let key_bal = DataKey::Balance(from.clone());
        env.storage()
            .persistent()
            .extend_ttl(&key_bal, 518_400, 518_400);
        let key_allow = DataKey::Allowance(from, spender);
        env.storage()
            .persistent()
            .extend_ttl(&key_allow, 518_400, 518_400);
    }

    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();
        let from_balance = Self::balance(env.clone(), from.clone());
        if from_balance < amount {
            panic_with_error!(&env, TokenError::InsufficientBalance);
        }
        let to_balance = Self::balance(env.clone(), to.clone());

        env.storage()
            .persistent()
            .set(&DataKey::Balance(from.clone()), &(from_balance - amount));
        env.storage()
            .persistent()
            .set(&DataKey::Balance(to.clone()), &(to_balance + amount));

        let key_from = DataKey::Balance(from);
        env.storage()
            .persistent()
            .extend_ttl(&key_from, 518_400, 518_400);
        let key_to = DataKey::Balance(to);
        env.storage()
            .persistent()
            .extend_ttl(&key_to, 518_400, 518_400);
    }

    pub fn transfer_from(env: Env, spender: Address, from: Address, to: Address, amount: i128) {
        spender.require_auth();
        let allowance = Self::allowance(env.clone(), from.clone(), spender.clone());
        if allowance < amount {
            panic_with_error!(&env, TokenError::InsufficientAllowance);
        }
        let from_balance = Self::balance(env.clone(), from.clone());
        if from_balance < amount {
            panic_with_error!(&env, TokenError::InsufficientBalance);
        }
        let to_balance = Self::balance(env.clone(), to.clone());

        env.storage().persistent().set(
            &DataKey::Allowance(from.clone(), spender.clone()),
            &(allowance - amount),
        );
        env.storage()
            .persistent()
            .set(&DataKey::Balance(from.clone()), &(from_balance - amount));
        env.storage()
            .persistent()
            .set(&DataKey::Balance(to.clone()), &(to_balance + amount));

        let key_from = DataKey::Balance(from.clone());
        env.storage()
            .persistent()
            .extend_ttl(&key_from, 518_400, 518_400);
        let key_to = DataKey::Balance(to);
        env.storage()
            .persistent()
            .extend_ttl(&key_to, 518_400, 518_400);
        let key_allow = DataKey::Allowance(from, spender);
        env.storage()
            .persistent()
            .extend_ttl(&key_allow, 518_400, 518_400);
    }

    pub fn approve(
        env: Env,
        from: Address,
        spender: Address,
        amount: i128,
        _expiration_ledger: u32,
    ) {
        from.require_auth();
        let key = DataKey::Allowance(from.clone(), spender.clone());
        env.storage().persistent().set(&key, &amount);
        env.storage()
            .persistent()
            .extend_ttl(&key, 518_400, 518_400);
    }

    pub fn allowance(env: Env, from: Address, spender: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Allowance(from, spender))
            .unwrap_or(0)
    }

    pub fn balance(env: Env, id: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Balance(id))
            .unwrap_or(0)
    }

    pub fn spendable_balance(env: Env, id: Address) -> i128 {
        Self::balance(env, id)
    }

    pub fn authorized(env: Env, id: Address) -> bool {
        env.storage()
            .instance()
            .get(&DataKey::Authorized(id))
            .unwrap_or(false)
    }

    pub fn set_authorized(env: Env, id: Address, authorize: bool) {
        // safe: storage is always set during initialize; panics on uninitialized contract
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        env.storage()
            .instance()
            .set(&DataKey::Authorized(id), &authorize);
    }

    pub fn decimals(_env: Env) -> u32 {
        7
    }

    pub fn name(env: Env) -> String {
        String::from_str(&env, "Akkuea Land Token")
    }

    pub fn symbol(env: Env) -> String {
        String::from_str(&env, "LAND")
    }

    pub fn faucet(env: Env, recipient: Address) {
        recipient.require_auth();

        let testnet_mode: bool = env
            .storage()
            .instance()
            .get(&DataKey::Testnet)
            .unwrap_or(false);
        if !testnet_mode {
            panic_with_error!(&env, TokenError::FaucetDisabled);
        }

        let is_claimed: bool = env
            .storage()
            .instance()
            .get(&DataKey::FaucetClaimed(recipient.clone()))
            .unwrap_or(false);

        if is_claimed {
            panic_with_error!(&env, TokenError::FaucetAlreadyClaimed);
        }

        env.storage()
            .instance()
            .set(&DataKey::FaucetClaimed(recipient.clone()), &true);

        // Faucet amount is 1,000 LAND (10^10 stroops)
        let faucet_amount: i128 = 10_000_000_000;
        let balance = Self::balance(env.clone(), recipient.clone());
        env.storage().persistent().set(
            &DataKey::Balance(recipient.clone()),
            &(balance + faucet_amount),
        );

        let key = DataKey::Balance(recipient);
        env.storage()
            .persistent()
            .extend_ttl(&key, 518_400, 518_400);
    }
}
