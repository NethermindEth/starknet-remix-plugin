import { DevnetAccount } from "../types/accounts";
import { Abi, Contract } from "../types/contracts";
import { Network, networkExplorerUrls } from "./constants";

function isValidCairo(filename: string) {
  return filename.endsWith(".cairo");
}

const getFileExtension = (filename: string) => filename.split(".").pop() || "";

const getFileNameFromPath = (path: string) => path.split("/").pop() || "";

const getContractNameFromFullName = (fullName: string) =>
  fullName.split(".")[0];

const artifactFolder = (path: string) => {
  if (path.includes("artifacts")) return path.split("/").slice(0, -1).join("/");
  return path.split("/").slice(0, -1).join("/").concat("/artifacts");
};

const artifactFilename = (ext: ".json" | ".casm", filename: string) =>
  filename.split(".")[0].concat(ext);

const getContractByClassHash = (classHash: string, contracts: Contract[]) => {
  return contracts.find((contract) => contract.classHash === classHash);
};

const getShortenedHash = (address: string, first: number, second: number) => {
  return `${address.slice(0, first)}...${address.slice(-1 * second)}`;
};

const getConstructor = (abi: Abi) => {
  return abi.find((item) => item.name === "constructor");
};

const getContractFunctions = (abi: Abi) => {
  const contractFunctions = abi.filter(
    (item) => item.type === "function" && item.name !== "constructor"
  );
  return contractFunctions;
};

const getReadFunctions = (abi: Abi) => {
  console.log(abi);
  const readFunctions = abi.filter(
    (item) =>
      item.type === "function" &&
      item.name !== "constructor" &&
      item.state_mutability === "view"
  );
  return readFunctions;
};

const getWriteFunctions = (abi: Abi) => {
  const writeFunctions = abi.filter(
    (item) =>
      item.type === "function" &&
      item.name !== "constructor" &&
      item.state_mutability === "external"
  );
  return writeFunctions;
};

const getParameterType = (parameter: string) => {
  return parameter.split("::").pop();
};

const getSelectedContractIndex = (
  contracts: Contract[],
  selectedContract: Contract | null
) => {
  if (selectedContract) {
    return contracts.findIndex(
      (contract) => contract.classHash === selectedContract.classHash
    );
  }
  return 0;
};

const getSelectedAccountIndex = (
  accounts: DevnetAccount[],
  selectedAccount: DevnetAccount | null
) => {
  if (selectedAccount) {
    return accounts.findIndex(
      (account) => account.address === selectedAccount.address
    );
  }
};

const getRoundedNumber = (number: number, decimals: number) => {
  return Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

const weiToEth = (wei: number) => {
  return wei / 10 ** 18;
};

const getExplorerUrl = (network: Network) => networkExplorerUrls[network];

export {
  isValidCairo,
  getFileExtension,
  getFileNameFromPath,
  getContractNameFromFullName,
  artifactFolder,
  artifactFilename,
  getContractByClassHash,
  getShortenedHash,
  getConstructor,
  getContractFunctions,
  getReadFunctions,
  getWriteFunctions,
  getParameterType,
  getSelectedContractIndex,
  getSelectedAccountIndex,
  getRoundedNumber,
  weiToEth,
  getExplorerUrl,
};
