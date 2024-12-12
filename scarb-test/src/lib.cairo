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
            self.value.write( self.value.read() + a );
        }
    }
}
