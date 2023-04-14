import { ProviderInterface, AccountInterface, constants } from "starknet";

// type StarknetChainId = constants.StarknetChainId;

enum StarknetChainId {
  SN_MAIN = "0x534e5f4d41494e",
  SN_GOERLI = "0x534e5f474f45524c49",
  SN_GOERLI2 = "0x534e5f474f45524c4932",
}

type Account = (AccountInterface & { icon: string }) | undefined;

type Provider = ProviderInterface | undefined;

type Connection = {
  connected: boolean;
  account: Account;
  provider: Provider;
};

export type { Account, Connection, Provider };

export { StarknetChainId };
