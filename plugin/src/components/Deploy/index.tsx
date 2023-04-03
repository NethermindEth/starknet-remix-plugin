// TODO: Divide in two components: Connection and Deploy.

import { useEffect, useMemo, useState } from "react";
import { connect, disconnect } from "get-starknet";
import { Provider, constants, shortString } from "starknet";
import { useDeploy } from "@starknet-react/core";

import "./styles.css";
import { Card } from "../Card";

interface FileInformation {
  fileName: string;
  isValidCairo: boolean;
  isValidSierra: boolean;
}

interface DeployProps {
  remixClient?: any;
  fileInfo: FileInformation;
  isCompiled: boolean;
}

const devnet = "http://127.0.0.1:5050";

// const getProvider = (network: string) => {
//   switch (network) {
//     case "mainnet-alpha":
//       return new Provider({
//         sequencer: { baseUrl: "https://sequencer.starknet.io" },
//       });
//     case "goerli-alpha":
//       return new Provider({
//         sequencer: { baseUrl: "https://goerli.starknet.io" },
//       });
//     case "goerli-alpha-2":
//       return new Provider({
//         sequencer: { baseUrl: "https://goerli.starknet.io" },
//       });
//     case devnet:
//       return new Provider({
//         // Let user chose port eventually.
//         sequencer: { baseUrl: "http://127.0.0.1:5050" },
//       });
//     default:
//       return new Provider({
//         sequencer: { baseUrl: "https://goerli.starknet.io" },
//       });
//   }
// };

function Deploy({
  remixClient,
  fileInfo: { fileName, isValidCairo, isValidSierra },
  isCompiled,
}: DeployProps) {
  const [connected, setConnected] = useState(false);
  const [provider, setProvider] = useState<any>(null);
  const [connectedProvider, setConnectedProvider] = useState<any>(null);
  const [account, setAccount] = useState({ address: "", icon: "" });
  const [selectedNetwork, setSelectedNetwork] = useState("goerli-alpha");
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);
  const [intededNetwork, setIntededNetwork] = useState(false);
  const [actualNetwork, setActualNetwork] = useState(false);

  const shortenedAddress = useMemo(() => {
    if (!account) return "";
    return `${account.address.slice(0, 6)}...${account.address.slice(-4)}`;
  }, [account]);

  // useEffect(() => {
  //   setProvider(getProvider(selectedNetwork));
  //   console.log("Selected provider: ", provider);
  // }, [selectedNetwork]);

  const networks = [
    { name: "Testnet", value: "goerli-alpha" },
    { name: "Testnet 2", value: "goerli-alpha-2" },
    { name: "Devnet", value: devnet },
    { name: "Mainnet", value: "mainnet-alpha" },
  ];

  const networkEquivalents = new Map([
    [constants.StarknetChainId.SN_GOERLI, "goerli-alpha"],
    [constants.StarknetChainId.SN_GOERLI2, "goerli-alpha-2"],
    [constants.StarknetChainId.SN_MAIN, "mainnet-alpha"],
  ]);

  const handleNetworkChange = (event: any) => {
    setSelectedNetwork(event.target.value);
    setIsWrongNetwork(false);
    if (
      connected &&
      connectedProvider &&
      connectedProvider.baseUrl.startsWith("http://localhost")
    ) {
      if (selectedNetwork !== devnet) {
        // Modal?
        setIsWrongNetwork(true);
      } else {
        setIsWrongNetwork(false);
        setConnected(false);
        setAccount({ address: "", icon: "" });
      }
    } else {
      if (
        connected &&
        connectedProvider &&
        selectedNetwork !== networkEquivalents.get(connectedProvider.chainId)
      ) {
        setIsWrongNetwork(true);
        setConnected(false);
        setAccount({ address: "", icon: "" });
        setConnectedProvider(null);
      }
    }
  };

  const networkSelect = (
    <select
      className="custom-select"
      aria-label=".form-select-sm example"
      onChange={handleNetworkChange}
    >
      {networks.map((network, index) => (
        <option
          value={network.value}
          defaultValue={selectedNetwork}
          key={index}
        >
          {network.name}
        </option>
      ))}
    </select>
  );

  const handleConnectWallet = async () => {
    console.log("Connecting wallet to " + selectedNetwork);
    try {
      const connectionData = await connect({
        modalMode: "alwaysAsk",
        modalTheme: "dark",
      });
      console.log("Connection data: ", connectionData);
      if (
        connectionData?.account?.provider?.baseUrl.startsWith(
          "http://localhost"
        )
      ) {
        if (selectedNetwork !== devnet) {
          // Modal?
          setIsWrongNetwork(true);
        } else {
          setConnected(true);
          setIsWrongNetwork(false);
          setConnectedProvider(connectionData?.account?.provider);
          setAccount({
            address: connectionData?.selectedAddress || "",
            icon: connectionData?.icon || "",
          });
        }
      } else {
        console.log(
          "ChainId",
          networkEquivalents.get(connectionData?.account?.provider?.chainId)
        );
        console.log("Selected network", selectedNetwork);
        if (
          // This is flaky.
          networkEquivalents.get(
            connectionData?.account?.provider?.chainId ||
              constants.StarknetChainId.SN_GOERLI
          ) === selectedNetwork
        ) {
          setConnected(true);
          setIsWrongNetwork(false);
          setConnectedProvider(connectionData?.account?.provider);
          setAccount({
            address: connectionData?.selectedAddress || "",
            icon: connectionData?.icon || "",
          });
        } else {
          setIsWrongNetwork(true);
        }
      }
    } catch (error) {
      console.log("Error connecting wallet: ", error);
    }
  };

  const handleDisconnectWallet = async () => {
    console.log("Disconnecting wallet from " + selectedNetwork);
    try {
      await disconnect({ clearLastWallet: true });
      setAccount({ address: "", icon: "" });
      setIsWrongNetwork(false);
    } catch (error) {
      console.log("Error disconnecting wallet: ", error);
    }
    setConnected(false);
  };

  // TODO: Extract to helpers.
  let artifactFolder = (path: string) => {
    if (path.includes("artifacts"))
      return path.split("/").slice(0, -1).join("/");
    return path.split("/").slice(0, -1).join("/").concat("/artifacts");
  };

  const getArtifactFile = async () => {
    const currentFilePath = await remixClient.call(
      "fileManager",
      "getCurrentFile",
      fileName
    );

    let artifactFilePath = currentFilePath;
    const [name, extension] = fileName.split(".");
    if (extension === "cairo") {
      // The file location is in the artifacts folder inside the current folder.
      artifactFilePath = artifactFolder(currentFilePath) + "/" + name + ".json";
    } else if (extension === "json" || extension === "casm") {
      artifactFilePath =
        // The file location is in the current folder.
        currentFilePath.split(".").slice(0, -1).join(".") + "json";
    }

    const sierraFileContent = await remixClient.call(
      "fileManager",
      "readFile",
      artifactFilePath
    );

    return { sierraFileContent, artifactFilePath };
  };

  const handleDeploy = () => {
    // provider;
    // getFile("json");
    console.log("Deploying to " + selectedNetwork);
  };

  // A function that reads the sierra json in contracts/artifacts or wherever the file might be
  // and gets the abi, and gets the first function, which should be the constructor function
  // and returns the names and the types of the arguments

  const getConstructorArguments = async (contractName: string) => {
    const { sierraFileContent } = await getArtifactFile();
    const sierraFile = JSON.parse(sierraFileContent);
    const abi = sierraFile.abi;
    const constructorFunction = abi.find(
      (abiFunction: any) => abiFunction.type === "constructor"
    );
    // TODO: Check here.
    const constructorArguments = constructorFunction.inputs;
    const constructorArgumentsNames = constructorArguments.map(
      (argument: any) => argument.name
    );
    const constructorArgumentsTypes = constructorArguments.map(
      (argument: any) => argument.type
    );
    return {
      constructorArgumentsNames,
      constructorArgumentsTypes,
      constructorArguments,
    };
  };

  const [constructorInputs, setConstructorInputs] = useState<any>([]);
  const [isAbiProcessed, setIsAbiProcessed] = useState(false);

  useEffect(() => {
    if (isCompiled) {
      getConstructorArguments(fileName).then((constructorInputs) => {
        console.log("Compilation done");
        setConstructorInputs(constructorInputs);
        setIsAbiProcessed(true);
      });
    }
  }, [isCompiled]);

  // A function that takes the names and the types and generates a form for the arguments of the
  // constructor function

  const getConstructorArgumentsForm = () => {
    const {
      constructorArgumentsNames,
      constructorArgumentsTypes,
      constructorArguments,
    } = constructorInputs;
    const constructorArgumentsForm = (
      <>
        {constructorArguments.map((argument: any, index: number) => {
          const argumentName = constructorArgumentsNames[index];
          const argumentType = constructorArgumentsTypes[index];
          return (
            <div className="flex">
              <label className="">{argumentName}</label>
              <input
                className="form-control form-control-sm"
                type="text"
                placeholder={argumentType}
              />
            </div>
          );
        })}
      </>
    );
    return constructorArgumentsForm;
  };

  // If the abi has been processed and the constructor arguments have been extracted, then
  // show the form for the constructor arguments
  // useEffect(() => {}, [constructorArgumentsForm]);

  // A constructorCallData function that uses useMemo to set and transform the data needed for the
  // contract deployment using encodeShortString for strings

  // const getConstructorCallData = async (contractName: string) => {
  //   const { constructorArguments } = await getConstructorArguments(
  //     contractName
  //   );
  //   const constructorCallData = constructorArguments.map(
  //     (argument: any, index: number) => {
  //       const {type, name} = argument;
  //       if (type === "core::felt") {
  //         return shortString.encodeShortString(name);
  //       }
  //       if (type === "core::starknet::contract_address::ContractAddress") {
  //         return name;
  //       }
  //       else {
  //         return
  //       }
  //       // const argumentValue = document.getElementById(argumentName)
  //       //   ?.value as string;
  //       // if (argumentType === "string") {
  //       //   return shortString.encodeShortString(argumentValue);
  //       // } else {
  //       //   return argumentValue;
  //       // }
  //     }
  //   );
  //   return constructorCallData;
  // };

  // const constructorCalldata = useMemo(() =>

  const getClassHash = (contractName: string) => {
    const contract = remixClient.call("fileManager", "getFile", contractName);
  };

  return (
    <>
      <Card header="Deploy">
        <div className="flex">
          <label className="">Network</label>
          {networkSelect}
        </div>
        {isWrongNetwork && (
          <div className="mt-3">
            <i>
              You're trying to connect to the wrong network, kindly change it in
              your wallet
            </i>
          </div>
        )}
        <div className="">
          <div>
            {!connected && (
              <button
                className="btn btn-primary btn-block d-block w-100 text-break remixui_disabled mb-1 mt-3"
                onClick={handleConnectWallet}
              >
                <div className="d-flex align-items-center justify-content-center">
                  <div className="text-truncate overflow-hidden text-nowrap">
                    <span>Connect wallet</span>
                  </div>
                </div>
              </button>
            )}
            {connected && (
              <button
                className="btn btn-primary btn-block d-block w-100 text-break remixui_disabled mb-1 mt-3"
                onClick={handleDisconnectWallet}
              >
                <div className="d-flex align-items-center justify-content-center">
                  <div className="text-truncate overflow-hidden text-nowrap flex align-items-center">
                    <img
                      src={account.icon}
                      alt="Wallet icon"
                      className="mr-1"
                      width="16px"
                      height="16px"
                    />
                    <span>Disconnect {shortenedAddress}</span>
                  </div>
                </div>
              </button>
            )}
          </div>
          {isAbiProcessed && getConstructorArgumentsForm()}
          <button
            className="btn btn-primary btn-block d-block w-100 text-break remixui_disabled mb-1 mt-3"
            style={{
              cursor: `${!connected ? "not-allowed" : "pointer"}`,
            }}
            aria-disabled={!connected}
            // style={{
            //   cursor: `${
            //     !validation || !currentFileName ? "not-allowed" : "pointer"
            //   }`,
            // }}
            // aria-disabled={!validation || !currentFileName}
            onClick={handleDeploy}
          >
            <div className="d-flex align-items-center justify-content-center">
              <div className="text-truncate overflow-hidden text-nowrap">
                <span>Deploy</span>
              </div>
            </div>
          </button>
        </div>
      </Card>
    </>
  );
}

export default Deploy;
