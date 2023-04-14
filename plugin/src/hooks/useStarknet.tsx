import {
  connect,
  disconnect,
  type ConnectOptions,
  type DisconnectOptions,
  type StarknetWindowObject,
} from "get-starknet";
import { useEffect, useState } from "react";
import { Provider } from "starknet";
import { StarknetChainId } from "../types/accounts";

import {
  FunctionReturnType,
  ParameterMetadata,
  ParameterType,
} from "../types/contracts";
import { normalizeParam } from "../utils/starknet";
import storage from "../utils/storage";

export enum ErrorType {
  NoWalletDetected = "NoWalletDetected",
  WrongNetwork = "WrongNetwork",
}

type InvokeFunctionResponse = {
  transaction_hash: string;
};

const walletDownloadLinks = {
  Braavos:
    "https://chrome.google.com/webstore/detail/braavos-wallet/jnlgamecbpmbajjfhmmmlhejkemejdma/",
  "Argent X":
    "https://chrome.google.com/webstore/detail/argent-x-starknet-wallet/dlcobpjiigpikoobohmabehhmhfoodbb/",
};

export type ProviderWithId = Readonly<{
  /**
   * Starknet URL.
   *
   * @example `'https://alpha-mainnet.starknet.io'`
   */
  provider: string;
  id: StarknetChainId;
}>;

export type ChainKey =
  | ""
  | "dev."
  | "goerli."
  | "goerli-2."
  | "dev-goerli."
  | "dev-goerli-2."
  | "integration.";

const chains: Record<ChainKey, ProviderWithId> = {
  "": {
    provider: "https://alpha-mainnet.starknet.io",
    id: StarknetChainId.SN_MAIN,
  },
  "dev.": {
    provider: "https://alpha-mainnet.starknet.io",
    id: StarknetChainId.SN_MAIN,
  },
  "goerli.": {
    provider: "https://alpha4.starknet.io",
    id: StarknetChainId.SN_GOERLI,
  },
  "goerli-2.": {
    provider: "https://alpha4-2.starknet.io",
    id: StarknetChainId.SN_GOERLI,
  },
  "dev-goerli.": {
    provider: "https://alpha4.starknet.io",
    id: StarknetChainId.SN_GOERLI,
  },
  "dev-goerli-2.": {
    provider: "https://alpha4-2.starknet.io",
    id: StarknetChainId.SN_GOERLI,
  },
  "integration.": {
    provider: "https://external.integration.starknet.io",
    id: StarknetChainId.SN_GOERLI,
  },
};

export const chainKey = window.location.hostname.slice(
  0,
  window.location.hostname.indexOf("voyager.online")
) as keyof typeof chains;

export let chain: ProviderWithId;

if (process.env.REACT_APP_STARKNET_URL === undefined)
  chain = chains[chainKey] || {
    provider: "https://alpha4.starknet.io",
    id: StarknetChainId.SN_GOERLI,
  };
// default for localhost
else {
  // TODO: make it localhost.
  const id = process.env.REACT_APP_IS_MAINNET
    ? StarknetChainId.SN_MAIN
    : StarknetChainId.SN_GOERLI;
  chain = { provider: process.env.REACT_APP_STARKNET_URL, id };
}

export default function useStarknet() {
  const [starknet, setStarknet] = useState<any | undefined>(undefined);

  const [address, setAddress] = useState<any | undefined>(undefined);
  const [error, setError] = useState<ErrorType | undefined>(undefined);

  const handleConnect = async (
    options: ConnectOptions = { modalMode: "alwaysAsk" }
  ) => {
    try {
      const connectedStarknet: StarknetWindowObject | null = await connect(
        options
      );
      setAddress(connectedStarknet?.account);
      setStarknet(connectedStarknet);
      if (connectedStarknet) {
        connectedStarknet.on("accountsChanged", async () => {
          const connectedStarknet: StarknetWindowObject | null = await connect({
            modalMode: "neverAsk",
          });
          setAddress(connectedStarknet?.account);
          setStarknet(connectedStarknet);
        });
      }
      storage.set("wallet-connected", true);
    } catch (err) {
      setError(ErrorType.NoWalletDetected);
    }
  };

  const handleDisconnect = async (
    options: DisconnectOptions = { clearLastWallet: true }
  ) => {
    await disconnect(options);
    setAddress(undefined);
    setStarknet(undefined);
    storage.set("wallet-connected", undefined);
  };

  useEffect(() => {
    if (error && error !== ErrorType.WrongNetwork) {
      return;
    }

    if (
      chain.id &&
      starknet &&
      starknet.account &&
      chain.id !== starknet.account.chainId
    ) {
      setError(ErrorType.WrongNetwork);
    } else {
      setError(undefined);
    }
  }, [address, error, starknet]);

  const changeWalletProvider = () => {
    connect({ modalMode: "alwaysAsk" }).then((connectedStarknet) => {
      setStarknet(connectedStarknet || starknet);
      setAddress(connectedStarknet?.account || address);
    });
  };

  const read = (
    contractAddress: string,
    functionName: string,
    calldata: { [param: string]: any },
    metadata: ParameterMetadata[],
    signature?: string[]
  ): Promise<FunctionReturnType> => {
    const transformedCalldata = transformComplexType(metadata, calldata);

    const normalizedCalldata = Object.keys(transformedCalldata).flatMap((key) =>
      normalizeParam(
        transformedCalldata[key],
        metadata.filter((f) => f.name === key)[0]
      )
    );
    const provider = new Provider({ sequencer: { baseUrl: chain.provider } });

    if (!starknet || !starknet?.account || !address || error) {
      return provider.callContract(
        {
          contractAddress,
          entrypoint: functionName,
          calldata: normalizedCalldata,
        },
        "pending"
      );
    }

    return provider.callContract(
      {
        contractAddress,
        entrypoint: functionName,
        calldata: normalizedCalldata,
      },
      "pending"
    );
  };

  const write = (
    contractAddress: string,
    functionName: string,
    calldata: { [param: string]: any },
    metadata: ParameterMetadata[],
    signature?: string[]
  ): Promise<FunctionReturnType> => {
    const transformedCalldata = transformComplexType(metadata, calldata);

    const normalizedCalldata = Object.keys(transformedCalldata).flatMap((key) =>
      normalizeParam(
        transformedCalldata[key],
        metadata.filter((f) => f.name === key)[0]
      )
    );

    if (!starknet || !starknet.account || !address || error) {
      return starknet!.account
        .execute({
          contractAddress,
          entrypoint: functionName,
          calldata: normalizedCalldata,
        })
        .then((x: InvokeFunctionResponse) => ({ result: x.transaction_hash }));
    }

    return starknet.account
      .execute({
        contractAddress,
        entrypoint: functionName,
        calldata: normalizedCalldata,
      })
      .then((x: InvokeFunctionResponse) => ({ result: x.transaction_hash }));
  };

  return {
    walletName: starknet?.name || "Wallet",
    walletDownloadLink: starknet?.name
      ? (walletDownloadLinks as any)[starknet.name]
      : walletDownloadLinks["Argent X"],
    address: address?.address,
    error,
    connect: handleConnect,
    disconnect: handleDisconnect,
    changeProvider: changeWalletProvider,
    read,
    write,
  };
}

// this function transforms indexing approach that was applied on UI side
function transformComplexType(
  metadata: ParameterMetadata[],
  calldata: { [param: string]: any }
) {
  const transformedCalldata: { [param: string]: any } = [];
  for (let i = 0; i < metadata.length; i++) {
    const names = metadata[i].names ? metadata[i].names : [];
    if (metadata[i].type === ParameterType.Complex && names) {
      let index = 1;
      const transformed: any[] = [];
      let loop = true;
      while (loop) {
        for (const name of names) {
          const key = `${metadata[i].name}[${index}].${name}`;
          const value = calldata[key];
          if (value !== undefined) {
            transformed.push(value);
            delete calldata[key];
          } else {
            loop = false;
            break;
          }
        }
        const nextComplexElementExists =
          calldata[`${metadata[i].name}[${index + 1}].${names[0]}`];
        if (nextComplexElementExists) {
          index += 1;
        } else {
          loop = false;
        }
      }
      transformedCalldata[metadata[i].name] = transformed;
    } else {
      transformedCalldata[metadata[i].name] = calldata[metadata[i].name];
      delete calldata[metadata[i].name];
    }
  }
  return transformedCalldata;
}
