import { createContext } from "react";
import {
  Account,
  AccountInterface,
  Provider,
  ProviderInterface,
} from "starknet";

const ConnectionContext = createContext({
  provider: null as Provider | ProviderInterface | null,
  setProvider: (_: Provider | ProviderInterface | null) => {},
  account: null as Account | AccountInterface | null,
  setAccount: (_: Account | AccountInterface | null) => {},
});

export { ConnectionContext };
