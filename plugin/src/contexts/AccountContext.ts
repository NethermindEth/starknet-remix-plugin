import { createContext } from "react";

const AccountContext = createContext({
  account: null,
  setAccount: (account: any) => {},
});

export { AccountContext };
