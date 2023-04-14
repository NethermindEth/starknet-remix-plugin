import { createContext } from "react";
import { Connection } from "../types/accounts";

const ConnectionContext = createContext({
  connection: {
    connected: false,
    account: undefined,
    provider: undefined,
    network: "goerli-alpha",
  } as Connection,
  setConnection: (connection: Connection) => {},
});

export { ConnectionContext };
