import { createContext } from "react";
import { devnets, Devnet, DevnetAccount } from "../utils/network";

const DevnetContext = createContext({
    devnet : devnets[0] as Devnet,
    setDevnet : (_: Devnet) => {},
    availableDevnetAccounts: [] as DevnetAccount[], 
    setAvailableDevnetAccounts: (_: DevnetAccount[]) => {},
    selectedDevnetAccount: null as DevnetAccount|null,
    setSelectedDevnetAccount: (_: DevnetAccount|null) => {},
    devnetEnv : true as boolean,
    setDevnetEnv : (_: boolean) => {},
});

export { DevnetContext };
