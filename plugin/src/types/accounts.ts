import { ProviderInterface, AccountInterface, constants } from "starknet";

type StarknetChainId = constants.StarknetChainId;

type Account = (AccountInterface & { icon: string }) | undefined;

type Provider = ProviderInterface | undefined;

type Connection = {
  connected: boolean;
  account: Account;
  provider: Provider;
};

export type { Account, Connection, Provider, StarknetChainId };
