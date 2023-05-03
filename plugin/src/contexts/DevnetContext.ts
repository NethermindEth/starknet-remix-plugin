import { createContext } from "react";
import { Account, Provider } from "starknet";
import { DevnetAccount } from "../types/accounts";
import { Devnet } from "../utils/network";

const DevnetContext = createContext({
  devnet: { name: "Local Devnet", url: process.env.REACT_APP_DEVNET_URL || "http://localhost:5050" },
  setDevnet: (devnet: Devnet) => {},
  availableAccounts: [] as DevnetAccount[],
  setAvailableAccounts: (accounts: DevnetAccount[]) => {},
  selectedAccount: null as DevnetAccount | null,
  setSelectedAccount: (account: DevnetAccount | null) => {},
  provider: null as Provider | null,
  setProvider: (provider: Provider) => {},
  account: null as Account | null,
  setAccount: (account: Account) => {},
});

export { DevnetContext };
