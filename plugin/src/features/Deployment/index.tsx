// TODO: Divide in two components: Connection and Deploy.

import { useContext, useEffect, useState } from "react";

import { useContractFactory, useDeploy } from "@starknet-react/core";
import { Card } from "../../components/Card";
import CompiledContracts from "../../components/CompiledContracts";
import { CompiledContractsContext } from "../../contexts/CompiledContractsContext";
import { ConnectionContext } from "../../contexts/ConnectionContext";
import { CallDataObject, Input } from "../../types/contracts";
import { getConstructor, getParameterType } from "../../utils/utils";
import "./styles.css";

interface DeploymentProps {}

function Deployment(props: DeploymentProps) {
  const [constructorCalldata, setConstructorCalldata] =
    useState<CallDataObject>({});
  const [finalCallData, setFinalCallData] = useState<any[]>([]);
  const [constructorInputs, setConstructorInputs] = useState<Input[]>([]);
  const [notEnoughInputs, setNotEnoughInputs] = useState(false);
  const {
    connection: { account, connected },
  } = useContext(ConnectionContext);
  const { contracts, selectedContract } = useContext(CompiledContractsContext);

  const { contractFactory } = useContractFactory({
    account: account,
    classHash: selectedContract?.classHash || "",
    compiledContract: selectedContract?.sierra,
    // abi: selectedContract?.abi,
  });

  console.log("Contract Factory", contractFactory);
  console.log("Sierra", selectedContract?.sierra);

  const { deploy, error } = useDeploy({
    contractFactory,
    constructorCalldata: finalCallData,
  });

  useEffect(() => {
    console.log(error);
  }, [error]);

  useEffect(() => {
    setConstructorCalldata({});
    if (selectedContract) {
      console.log("Constructor", getConstructor(selectedContract?.abi));
      setConstructorInputs(getConstructor(selectedContract?.abi)?.inputs || []);
    }
  }, [selectedContract]);

  const handleDeploy = (calldata: string[]) => {
    console.log("Calldata:", calldata);
    setTimeout(() => {
      console.log("Deploying...");
      deploy();
      console.log("Error:", error);
    }, 200);
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
    console.log(name, value, type, index);
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
      const calldata = Object.values(constructorCalldata).map((input) => {
        // Check if Uint256 and use uint256.from() to convert to BN
        // let value = input.value;
        // if (input.type?.includes("Uint256")) {
        //   let uint = uint256.bnToUint256(new BN(input.value))
        // }
        return input.value;
      });
      return calldata;
    }
    return [];
  };

  return (
    <>
      <Card header="Deploy">
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
                className="btn btn-primary btn-block d-block w-100 text-break remixui_disabled mb-1 mt-3"
                style={{
                  cursor: `${!connected ? "not-allowed" : "pointer"}`,
                }}
                disabled={!connected}
                aria-disabled={!connected}
                type="submit"
              >
                <div className="d-flex align-items-center justify-content-center">
                  <div className="text-truncate overflow-hidden text-nowrap">
                    <span>Deploy</span>
                  </div>
                </div>
              </button>
            </form>
            {notEnoughInputs && (
              <label>Please fill out all constructor fields!</label>
            )}
          </div>
        ) : (
          <p>No contracts ready for deployment yet</p>
        )}
      </Card>
    </>
  );
}

export default Deployment;
