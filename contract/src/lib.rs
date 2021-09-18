// To conserve gas, efficient serialization is achieved through Borsh (http://borsh.io/)
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{LookupMap, Vector};
use near_sdk::{env, near_bindgen, setup_alloc};

setup_alloc!();

// Note: the names of the structs are not important when calling the smart contract, but the function names are
#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
pub struct TodoList {
    records: LookupMap<String, Vector<(String, bool)>>,
}

impl Default for TodoList {
    fn default() -> Self {
        Self {
            records: LookupMap::new(b"a".to_vec()),
        }
    }
}

#[near_bindgen]
impl TodoList {
    pub fn set_todo_list(&mut self, todo_list: Vec<String>, todo_check_list: Vec<bool>) {
        let account_id = env::signer_account_id();

        // Use env::log to record logs permanently to the blockchain!
        env::log(
            format!(
                "Saving todo list '{:?}' for account '{}'",
                todo_list, account_id,
            )
            .as_bytes(),
        );
        let mut todo_list_vector: Vector<(String, bool)> = Vector::new(b"b".to_vec());
        for todo_item in todo_list.into_iter().zip(todo_check_list) {
            todo_list_vector.push(&todo_item);
        }
        self.records.insert(&account_id, &todo_list_vector);
    }

    pub fn get_todo_list(&self, account_id: String) -> Vec<(String, bool)> {
        match self.records.get(&account_id) {
            Some(todo_list) => todo_list.to_vec(),
            None => vec![("List is empty".to_string(), false)],
        }
    }
}

/*
 * The rest of this file holds the inline tests for the code above
 * Learn more about Rust tests: https://doc.rust-lang.org/book/ch11-01-writing-tests.html
 *
 * To run from contract directory:
 * cargo test -- --nocapture
 *
 * From project root, to run in combination with frontend tests:
 * yarn test
 *
 */
#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::MockedBlockchain;
    use near_sdk::{testing_env, VMContext};

    // mock the context for testing, notice "signer_account_id" that was accessed above from env::
    fn get_context(input: Vec<u8>, is_view: bool) -> VMContext {
        VMContext {
            current_account_id: "alice_near".to_string(),
            signer_account_id: "bob_near".to_string(),
            signer_account_pk: vec![0, 1, 2],
            predecessor_account_id: "carol_near".to_string(),
            input,
            block_index: 0,
            block_timestamp: 0,
            account_balance: 0,
            account_locked_balance: 0,
            storage_usage: 0,
            attached_deposit: 0,
            prepaid_gas: 10u64.pow(18),
            random_seed: vec![0, 1, 2],
            is_view,
            output_data_receivers: vec![],
            epoch_height: 19,
        }
    }

    #[test]
    fn set_then_get_todo_list() {
        let context = get_context(vec![], false);
        testing_env!(context);
        let mut contract = TodoList::default();
        let todo_list = vec!["Do homework", "Buy some vegetables", "Make table"];
        let check_list = vec![false, true, true];
        contract.set_todo_list(
            todo_list
                .iter()
                .map(|todo_item| todo_item.to_string())
                .collect(),
            check_list,
        );
        assert_eq!(
            vec![
                ("Do homework".to_string(), false),
                ("Buy some vegetables".to_string(), true),
                ("Make table".to_string(), true),
            ],
            contract.get_todo_list("bob_near".to_string()).to_vec()
        );
    }

    #[test]
    fn get_default_todo_list() {
        let context = get_context(vec![], true);
        testing_env!(context);
        let contract = TodoList::default();
        assert_eq!(
            ("List is empty".to_string(), false),
            contract
                .get_todo_list("francis.near".to_string())
                .pop()
                .unwrap()
        );
    }
}
