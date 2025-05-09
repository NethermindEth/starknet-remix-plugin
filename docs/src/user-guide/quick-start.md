# Quick Start Guide

This guide will help you create and deploy your first Starknet smart contract using the Remix Plugin. We'll walk through creating a simple project with two contracts, compiling them, and deploying to Starknet.

## Creating Your First Project

1. **Set Up the Project Structure**

First, create a new directory for your project and set up the following files:

- `Scarb.toml` - The project configuration file that defines your project settings and dependencies:
```toml
[package]
name = "starknet_multiple_contracts"
version = "0.1.0"

[dependencies]
starknet = "2.6.4" # Latest stable Cairo version

[[target.starknet-contract]]
casm = true # Required for contract deployment
```

2. **Create the Contract Files**

Create the following file structure:
```
your-project/
├── Scarb.toml
└── src/
    ├── lib.cairo
    ├── balance.cairo
    └── forty_two.cairo
```

- `src/lib.cairo` - The main module file:
<!-- cairo is not supported, use rust instead -->
```rust
mod balance;
mod forty_two;
```

- `src/balance.cairo` - A contract implementing balance management:
<!-- cairo is not supported, use rust instead -->
```rust
#[starknet::interface]
trait IBalance<T> {
    // Returns the current balance.
    fn get(self: @T) -> u256;
    // Increases the balance by the given amount.
    fn increase(ref self: T, a: u256);
}

#[starknet::contract]
mod Balance {
    use traits::Into;

    #[storage]
    struct Storage {
        value: u256,
    }

    #[constructor]
    fn constructor(ref self: ContractState, value_: u256) {
        self.value.write(value_);
    }

    #[abi(embed_v0)]
    impl Balance of super::IBalance<ContractState> {
        fn get(self: @ContractState) -> u256 {
            self.value.read()
        }
        fn increase(ref self: ContractState, a: u256)  {
            self.value.write(self.value.read() + a);
        }
    }
}
```

- `src/forty_two.cairo` - A simple contract returning the number 42:
<!-- cairo is not supported, use rust instead -->
```rust 
#[starknet::contract]
mod FortyTwo {
    #[storage]
    struct Storage {}

    #[abi(embed_v0)]
    fn answer(ref self: ContractState) -> felt252 {
        42
    }
}
```

## Compiling Your Contracts

1. **Access the Plugin**:
   - Look for the Starknet icon in the left sidebar of Remix IDE
   - Click on it to open the plugin interface

2. **Compile the Project**:
   - Navigate to the "Compile" section in the plugin
   - Click the "Compile Project" button
   - Wait for the compilation process to complete
   - You'll see a success message when compilation is finished

## Declaring and Deploying Contracts

1. **Select Network**:
   - Choose your target network (e.g., Goerli testnet, Mainnet)
   - Ensure your wallet has sufficient funds for the selected network

2. **Declare Contract**:
   - Select the contract you want to deploy from the dropdown
   - Click "Declare" to submit the contract's class to the network
   - Confirm the transaction in your wallet
   - Wait for the declaration to be confirmed

3. **Deploy Contract**:
   - After declaration, click "Deploy"
   - Fill in any constructor parameters if required
   - Confirm the deployment transaction in your wallet
   - Wait for deployment confirmation

## Interacting with Your Contracts

1. **Access Contract Functions**:
   - Navigate to the "Contract" section
   - Your deployed contract's functions will be listed
   - Functions are grouped into "Read" and "Write" categories

2. **Execute Functions**:
   - For read functions (like `get_balance`):
     - Simply click the function to view the result
   - For write functions (like `increase_balance`):
     - Enter the required parameters
     - Click "Execute"
     - Confirm the transaction in your wallet

## Monitoring Transactions

1. **View Transaction History**:
   - Go to the "Transactions" section
   - See all your contract interactions
   - Monitor transaction status
   - Access transaction details on Starkscan or Voyager

2. **Transaction Management**:
   - Track pending transactions
   - View transaction receipts
   - Monitor gas usage and costs

## Next Steps

After completing this quick start guide, you can:
- Explore more complex contract interactions
- Learn about [advanced features](./advanced-features.md)
- Understand [transaction management](./transactions.md)
- Study [account management](./accounts.md)

Remember to always test your contracts thoroughly on testnet before deploying to mainnet.

