#![no_std]
use soroban_sdk::{contract, contractimpl, Env};

#[contract]
pub struct GameLandToken;

#[contractimpl]
impl GameLandToken {
    pub fn init(_env: Env) {}
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::Env;

    #[test]
    fn test_init() {
        let env = Env::default();
        let contract_id = env.register(GameLandToken, ());
        let client = GameLandTokenClient::new(&env, &contract_id);
        client.init();
    }
}
