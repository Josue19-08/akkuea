#![no_std]
use soroban_sdk::{contract, contractimpl, Env};

#[contract]
pub struct GameEngine;

#[contractimpl]
impl GameEngine {
    pub fn init(_env: Env) {}
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::Env;

    #[test]
    fn test_init() {
        let env = Env::default();
        let contract_id = env.register(GameEngine, ());
        let client = GameEngineClient::new(&env, &contract_id);
        client.init();
    }
}
