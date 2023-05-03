import { DevnetAccount } from "../types/accounts";

const apiUrl = process.env.REACT_APP_API_URL;
const devnetUrl = process.env.REACT_APP_DEVNET_URL || "http://localhost:5050";

type Devnet = {
  name: string;
  url: string;
}

const devnets: Devnet[] = [
  {
    name: "Local Devnet",
    url: "http://localhost:5050",
  },
  {
    name: "Remote Devnet",
    url: "https://cairo-api.starkfees.xyz:5050",
  },
];

const getAccounts = async (customDevnetUrl: string = devnetUrl) => {
  const response = await fetch(`${devnetUrl}/predeployed_accounts`);
  const accounts: DevnetAccount[] = await response.json();
  return accounts;
};

const getAccountBalance = async (address: string, customDevnetUrl: string = devnetUrl) => {
  const response = await fetch(`${devnetUrl}/account_balance?address=${address}`);
  const account = await response.json();
  return account.balance;
};

const getDevnetUrl = (network: string) => {
  const devnet = devnets.find((devnet) => devnet.name === network);
  if (!devnet) throw new Error("Devnet not found");
  return devnet.url;
};

const getDevnetName = (url: string) => {
  const devnet = devnets.find((devnet) => devnet.url === url);
  if (!devnet) throw new Error("Devnet not found");
  return devnet.name;
};

const getDevnetIndex = (devnets: Devnet[], devnet: Devnet) => {
  return devnets.findIndex((item) => item.name === devnet.name);
};

export { apiUrl, devnetUrl, devnets, getAccounts, getAccountBalance, getDevnetUrl, getDevnetName, getDevnetIndex };

export type { Devnet, DevnetAccount }