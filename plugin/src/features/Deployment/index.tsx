// TODO: Divide in two components: Connection and Deploy.

import { useContext, useEffect, useState } from "react";

// import { useContractFactory, useDeploy } from "@starknet-react/core";
import { BigNumberish } from "ethers";
import { uint256 } from "starknet";
import { Card } from "../../components/Card";
import CompiledContracts from "../../components/CompiledContracts";
import { CompiledContractsContext } from "../../contexts/CompiledContractsContext";
import { DevnetContext } from "../../contexts/DevnetContext";
import { CallDataObject, Contract, Input } from "../../types/contracts";
import { getConstructor, getParameterType } from "../../utils/utils";
import "./styles.css";
import Container from "../../components/Container";
import { AccordianTabs } from "../../components/CompileAndDeploy";

interface DeploymentProps {
  setActiveTab: (tab: AccordianTabs) => void;
}

function Deployment({ setActiveTab }: DeploymentProps) {
  const [isDeploying, setIsDeploying] = useState(false);
  const [constructorCalldata, setConstructorCalldata] =
    useState<CallDataObject>({});
  const [finalCallData, setFinalCallData] = useState<any[]>([]);
  const [constructorInputs, setConstructorInputs] = useState<Input[]>([]);
  const [notEnoughInputs, setNotEnoughInputs] = useState(false);
  const { devnet, availableAccounts, selectedAccount, account, provider } =
    useContext(DevnetContext);
  const { contracts, selectedContract, setContracts, setSelectedContract } =
    useContext(CompiledContractsContext);

  useEffect(() => {
    setConstructorCalldata({});
    if (selectedContract) {
      console.log("Constructor", getConstructor(selectedContract?.abi));
      setConstructorInputs(getConstructor(selectedContract?.abi)?.inputs || []);
    }
  }, [selectedContract]);

  const deploy = async (calldata: BigNumberish[]) => {
    console.log("Provider:", provider);
    console.log("Account:", account);
    console.log("ClassHash:", selectedContract?.classHash);
    console.log("Contract:", selectedContract?.sierra);
    setIsDeploying(true);
    try {
      const declareAndDeployResponse = await account?.declareAndDeploy(
        {
          contract: selectedContract?.sierra,
          casm: selectedContract?.casm,
          constructorCalldata: calldata,
        },
        { cairoVersion: "1" }
      );
      console.log(declareAndDeployResponse?.deploy.contract_address);
      setContractDeployment(
        selectedContract as Contract,
        declareAndDeployResponse?.deploy.contract_address || ""
      );
      // setContractAsDeployed(selectedContract as Contract);
      setIsDeploying(false);
      console.log(declareAndDeployResponse);
    } catch (error) {
      console.log(error);
      setIsDeploying(false);
    }
  };

  const handleDeploy = (calldata: BigNumberish[]) => {
    console.log("Calldata:", calldata);
    console.log(`Deploying to ${devnet.name}...`);
    deploy(calldata);
  };

  const handleDeploySubmit = (event: any) => {
    event.preventDefault();
    console.log("Submit deployment");
    const formDataValues = Object.values(constructorCalldata);
    if (
      formDataValues.length < constructorInputs.length ||
      formDataValues.some((input) => !input.value)
    ) {
      setNotEnoughInputs(true);
    } else {
      setNotEnoughInputs(false);
      const calldata = getFormattedCalldata();
      setFinalCallData(calldata);
      handleDeploy(calldata);
    }
  };

  const handleConstructorCalldataChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    event.preventDefault();
    const {
      name,
      value,
      dataset: { type, index },
    } = event.target;
    setConstructorCalldata((prevCalldata) => ({
      ...prevCalldata,
      [index!]: {
        name,
        value,
        type,
      },
    }));
  };

  const getFormattedCalldata = () => {
    if (constructorCalldata) {
      let formattedCalldata: BigNumberish[] = [];

      Object.values(constructorCalldata).forEach((input) => {
        console.log("Input", input);
        // Check if Uint256 and use uint256.from() to convert to BN
        if (input.type?.includes("u256")) {
          let uint = uint256.bnToUint256(input.value);
          formattedCalldata.push(uint.low);
          formattedCalldata.push(uint.high);
        } else {
          formattedCalldata.push(input.value);
        }
      });

      return formattedCalldata;
    }
    return [];
  };

  const setContractDeployment = (
    currentContract: Contract,
    address: string
  ) => {
    console.log("Setting contract deployment");
    console.log("Current contract:", currentContract);
    console.log("Address:", address);
    const deployedContract = {
      ...currentContract,
      address: address,
      deployed: true,
    };
    console.log("Deployed contract:", deployedContract);
    const updatedContracts = contracts.map((contract) => {
      if (contract.classHash === deployedContract.classHash) {
        return deployedContract;
      }
      return contract;
    });
    setContracts(updatedContracts);
    setSelectedContract(deployedContract);
    console.log("Contract selected:", selectedContract);
    console.log("Contracts:", contracts);
  };

  return (
    <>
      <Container>
        {contracts.length > 0 && selectedContract ? (
          <div className="">
            <CompiledContracts />
            <form onSubmit={handleDeploySubmit}>
              {constructorInputs.map((input, index) => {
                return (
                  <div
                    className="udapp_multiArg constructor-label-wrapper"
                    key={index}
                  >
                    <label key={index} className="constructor-label">
                      {`${input.name} (${getParameterType(input.type)}): `}
                    </label>
                    <input
                      className="form-control constructor-input"
                      name={input.name}
                      data-type={input.type}
                      data-index={index}
                      value={constructorCalldata[index]?.value || ""}
                      onChange={handleConstructorCalldataChange}
                    />
                  </div>
                );
              })}
              <button
                className="btn btn-primary btn-block d-block w-100 text-break remixui_disabled mb-1 mt-3 px-0"
                style={{
                  cursor: `${
                    !selectedAccount && !selectedContract.deployed
                      ? "not-allowed"
                      : "pointer"
                  }`,
                }}
                disabled={!selectedAccount && !selectedContract.deployed}
                aria-disabled={!selectedAccount && !selectedContract.deployed}
                type="submit"
              >
                <div className="d-flex align-items-center justify-content-center">
                  <div className="text-truncate overflow-hidden text-nowrap">
                    {isDeploying ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm"
                          role="status"
                          aria-hidden="true"
                        >
                          {" "}
                        </span>
                        <span style={{ paddingLeft: "0.5rem" }}>
                          Deploying...
                        </span>
                      </>
                    ) : (
                      <div className="text-truncate overflow-hidden text-nowrap">
                        <span>Deploy {selectedContract.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            </form>
            {selectedContract.deployed && (
              <div className="mt-3">
                <label style={{ display: "block" }}>Contract deployed!</label>
                <label style={{ display: "block" }}>
                  See{" "}
                  <a
                    href="/"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab("interaction");
                    }}
                  >
                    Interact
                  </a>{" "}
                  for more!
                </label>
              </div>
            )}
            {notEnoughInputs && (
              <label>Please fill out all constructor fields!</label>
            )}
          </div>
        ) : (
          <p>No contracts ready for deployment yet</p>
        )}
      </Container>
    </>
  );
}

export default Deployment;
