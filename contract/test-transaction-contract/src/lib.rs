use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::{env, near_bindgen};

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
pub struct Contract {
    pub version: i8,
}

impl Default for Contract {
    fn default() -> Self {
        Self { version: 0 }
    }
}

#[near_bindgen]
impl Contract {
    #[init]
    pub fn new(version: i8) -> Self {
        // Ensure that the contract is not already initialized
        assert!(env::state_read::<Self>().is_none(), "Contract is already initialized");

        // Initialize the contract with the provided version
        Self { version }
    }

    pub fn test_transaction_event(
        &mut self,
        text: String,
    ) -> bool {
        env::log_str(&*text);
        return true;
    }

}

#[near_bindgen]
impl Contract {
    pub fn get_version(&self) -> i8 {
        self.version
    }
}
