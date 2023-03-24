import {
  Provider as TempProvider,
  AccountInterface as TempAccountInterface,
  StarknetChainId,
} from "starknet";

declare module "starknet" {
  export interface AccountInterface extends TempAccountInterface {
    provider?: Provider;
  }

  export interface Provider extends TempProvider {
    baseUrl: string;
    chainId: StarknetChainId;
  }
}
