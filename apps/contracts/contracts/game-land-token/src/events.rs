use soroban_sdk::{contractevent, Address, Env};

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TransferEvent {
    pub from: Address,
    pub to: Address,
    pub amount: i128,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ApprovalEvent {
    pub from: Address,
    pub spender: Address,
    pub amount: i128,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MintEvent {
    pub to: Address,
    pub amount: i128,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BurnEvent {
    pub from: Address,
    pub amount: i128,
}

pub fn emit_transfer(env: &Env, from: Address, to: Address, amount: i128) {
    TransferEvent { from, to, amount }.publish(env);
}

pub fn emit_approval(env: &Env, from: Address, spender: Address, amount: i128) {
    ApprovalEvent { from, spender, amount }.publish(env);
}

pub fn emit_mint(env: &Env, to: Address, amount: i128) {
    MintEvent { to, amount }.publish(env);
}

pub fn emit_burn(env: &Env, from: Address, amount: i128) {
    BurnEvent { from, amount }.publish(env);
}
