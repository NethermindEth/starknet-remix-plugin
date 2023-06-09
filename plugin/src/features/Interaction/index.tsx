import { BigNumberish } from "ethers";
import { useContext, useEffect, useState } from "react";
import {
  Account,
  RawCalldata,
  uint256,
  CallContractResponse,
  GetTransactionReceiptResponse,
  AccountInterface,
} from "starknet";
import { Card } from "../../components/Card";
import CompiledContracts from "../../components/CompiledContracts";
import { CompiledContractsContext } from "../../contexts/CompiledContractsContext";
import { AbiElement } from "../../types/contracts";
import { getReadFunctions, getWriteFunctions } from "../../utils/utils";
<<<<<<< HEAD
import Container from "../../components/Container";
=======
import { ConnectionContext } from "../../contexts/ConnectionContext";
>>>>>>> deploy

interface InteractionProps {}

function Interaction(_: InteractionProps) {
  const [readFunctions, setReadFunctions] = useState<AbiElement[]>([]);
  const [writeFunctions, setWriteFunctions] = useState<AbiElement[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const { contracts, selectedContract } = useContext(CompiledContractsContext);

  const {account, provider} = useContext(ConnectionContext);

  type Response = {
    contractName: string;
    contractAddress: string;
    functionName: string;
    callResponse?: CallContractResponse;
    invocationResponse?: GetTransactionReceiptResponse;
  };

  useEffect(() => {
    if (selectedContract) {
      let readFunctions = getReadFunctions(selectedContract?.abi);
      let writeFunctions = getWriteFunctions(selectedContract?.abi);
      console.log("Read Functions", readFunctions);
      console.log("Write Functions", writeFunctions);

      // Extract to utils
      // Creates indices to handle cases when uint256 are there.
      // TODO: expand to handle other types.
      readFunctions = readFunctions.map((func) => {
        const calldataIndices: number[] = func.inputs.reduce(
          (calldataIndices: number[], input, index: number) => {
            if (index === 0) {
              calldataIndices[0] = 0;
              return calldataIndices;
            }
            if (func.inputs[index - 1].type.endsWith("u256")) {
              calldataIndices.push(calldataIndices[index - 1] + 2);
              return calldataIndices;
            } else {
              calldataIndices.push(calldataIndices[index - 1] + 1);
              return calldataIndices;
            }
          },
          [] as number[]
        );
        return { ...func, calldataIndices };
      });

      writeFunctions = writeFunctions.map((func) => {
        const calldataIndices: number[] = func.inputs.reduce(
          (calldataIndices: number[], input, index: number) => {
            if (index === 0) {
              calldataIndices[0] = 0;
              return calldataIndices;
            }
            if (func.inputs[index - 1].type.endsWith("u256")) {
              calldataIndices.push(calldataIndices[index - 1] + 2);
              return calldataIndices;
            } else {
              calldataIndices.push(calldataIndices[index - 1] + 1);
              return calldataIndices;
            }
          },
          [] as number[]
        );
        return { ...func, calldataIndices };
      });

      setReadFunctions(readFunctions);
      setWriteFunctions(writeFunctions);
    }
  }, [selectedContract]);

  const getInvocation = (
    contractAddress: string,
    entrypoint: string,
    calldata: BigNumberish[] = []
  ) => {
    const invocation = async (account: Account| AccountInterface) => {
      const response = await account.execute({
        contractAddress,
        entrypoint,
        calldata: calldata as RawCalldata,
      });
      return response;
    };
    return invocation;
  };

  const getCall = (
    contractAddress: string,
    entrypoint: string,
    calldata: BigNumberish[] = []
  ) => {
    const call = async (account: Account | AccountInterface) => {
      const response = await account.callContract({
        contractAddress,
        entrypoint,
        calldata: calldata as RawCalldata,
      });
      return response;
    };
    return call;
  };

  // Handle calldata change
  const handleCalldataChange = (e: any) => {
    const { name, value, dataset } = e.target;
    const { type, index, datatype } = dataset;
    if (type === "view") {
      const functionIndex = getFunctionIndex(name, readFunctions);
      const newReadFunctions = [...readFunctions];
      if (datatype && (datatype as string).endsWith("u256")) {
        const calldataElementIndex =
          newReadFunctions[functionIndex].calldataIndices![parseInt(index)];
        let uint = uint256.bnToUint256(value);
        if (!newReadFunctions[functionIndex].calldata) {
          newReadFunctions[functionIndex].calldata = [];
        }
        newReadFunctions[functionIndex].calldata![calldataElementIndex] =
          uint.low;
        newReadFunctions[functionIndex].calldata![calldataElementIndex + 1] =
          uint.high;
      } else {
        const calldataElementIndex =
          newReadFunctions[functionIndex].calldataIndices![parseInt(index)];
        if (!newReadFunctions[functionIndex].calldata) {
          newReadFunctions[functionIndex].calldata = [];
        }
        newReadFunctions[functionIndex].calldata![calldataElementIndex] = value;
      }
      setReadFunctions(newReadFunctions);
    }
    if (type === "external") {
      const functionIndex = getFunctionIndex(name, writeFunctions);
      const newWriteFunctions = [...writeFunctions];
      console.log("Datatype", datatype);
      if (datatype && (datatype as string).endsWith("u256")) {
        const calldataElementIndex =
          newWriteFunctions[functionIndex].calldataIndices![parseInt(index)];
        let uint = uint256.bnToUint256(value);
        if (!newWriteFunctions[functionIndex].calldata) {
          newWriteFunctions[functionIndex].calldata = [];
        }
        newWriteFunctions[functionIndex].calldata![calldataElementIndex] =
          uint.low;
        newWriteFunctions[functionIndex].calldata![calldataElementIndex + 1] =
          uint.high;
      } else {
        console.log("THIS", functionIndex, newWriteFunctions[functionIndex]);
        const calldataElementIndex =
          newWriteFunctions[functionIndex].calldataIndices![parseInt(index)];
        if (!newWriteFunctions[functionIndex].calldata) {
          newWriteFunctions[functionIndex].calldata = [];
        }
        newWriteFunctions[functionIndex].calldata![calldataElementIndex] =
          value;
      }
      setWriteFunctions(newWriteFunctions);
    }
  };

  const getFunctionIndex = (name: string, functions: AbiElement[]) => {
    return functions.findIndex((func) => func.name === name);
  };

  const getFunctionFromName = (name: string, functions: AbiElement[]) => {
    return functions.find((func) => func.name === name);
  };

  const handleCall = async (e: any) => {
    e.preventDefault();
    const { name, type } = e.target.dataset;
    console.log(name, type);
    if (type === "view") {
      const func = getFunctionFromName(name, readFunctions);
      console.log(func);
      const callFunction = getCall(
        selectedContract?.address!,
        func?.name!,
        func?.calldata || []
      );
      const response = await callFunction(account!);
      console.log(response);
      setResponses((responses) => [
        ...responses,
        {
          functionName: func?.name!,
          contractName: selectedContract?.name!,
          contractAddress: selectedContract?.address!,
          callResponse: response,
        },
      ]);
    } else {
      const func = getFunctionFromName(name, writeFunctions);
      console.log(func?.calldata);
      const invocation = getInvocation(
        selectedContract?.address!,
        func?.name!,
        func?.calldata || []
      );
      const response = await invocation(account!);
      console.log(response);
      console.log(
        "Transaction:",
        await account?.getTransaction(response.transaction_hash)
      );
      const resultOfTx = await provider?.waitForTransaction(
        response.transaction_hash
      );
      setResponses((responses) => [
        ...responses,
        {
          functionName: func?.name!,
          contractName: selectedContract?.name!,
          contractAddress: selectedContract?.address!,
          invocationResponse: resultOfTx,
        },
      ]);
    }
  };

  return (
    <Container>
      {contracts.length > 0 && selectedContract ? (
        <CompiledContracts />
      ) : (
        <div>
          <p>No compiled contracts to interact with... Yet.</p>
        </div>
      )}
      {readFunctions.map((func, index) => {
        return (
          <div
            className="udapp_contractActionsContainerSingle pt-2 function-label-wrapper"
            style={{ display: "flex" }}
            key={index}
          >
            <button
              className="udapp_instanceButton undefined btn btn-sm btn-warning w-50"
              data-name={func.name}
              data-type={func.state_mutability}
              onClick={handleCall}
            >
              {func.name}
            </button>
            <div className="function-inputs w-50">
              {func.inputs.length > 0 &&
                func.inputs.map((input, index) => {
                  return (
                    <input
                      className="form-control function-input"
                      name={func.name}
                      data-type={func.state_mutability}
                      data-index={index}
                      data-datatype={input.type}
                      placeholder={`${input.name} (${input.type
                        .split("::")
                        .pop()})`}
                      onChange={handleCalldataChange}
                      key={index}
                    />
                  );
                })}
            </div>
          </div>
        );
      })}
      {writeFunctions.map((func, index) => {
        return (
          <div
            className="udapp_contractActionsContainerSingle pt-2 function-label-wrapper"
            style={{ display: "flex" }}
            key={index}
          >
            <button
              className="udapp_instanceButton undefined btn btn-sm btn-info w-50"
              onClick={handleCall}
              data-name={func.name}
              data-type={func.state_mutability}
            >
              {func.name}
            </button>
            <div className="function-inputs w-50">
              {func.inputs.length > 0 &&
                func.inputs.map((input, index) => {
                  return (
                    <input
                      className="form-control function-input"
                      name={func.name}
                      data-type={func.state_mutability}
                      data-index={index}
                      data-datatype={input.type}
                      placeholder={`${input.name} (${input.type
                        .split("::")
                        .pop()})`}
                      // value={constructorCalldata[index]?.value || ""}
                      onChange={handleCalldataChange}
                      key={index}
                    />
                  );
                })}
            </div>
          </div>
        );
      })}
      {responses.length > 0 && (
        <div className="my-5">
          <p>Responses:</p>
          {responses.reverse().map((response, index) => {
            return (
              <div key={index} className="mb-4">
                <p className="mb-0">
                  Function: <i>{response.functionName}</i>
                </p>
                <p className="mb-0">
                  Contract: <i>{response.contractName}</i> at{" "}
                  <i>{response.contractAddress}</i>
                </p>
                {response.callResponse && (
                  <p className="mb-0">
                    Result:{" "}
                    <pre>{JSON.stringify(response.callResponse, null, 2)}</pre>
                  </p>
                )}
                {response.invocationResponse && (
                  <p className="mb-0">
                    Response:{" "}
                    <pre>
                      {JSON.stringify(response.invocationResponse, null, 2)}
                    </pre>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Container>
  );
}

export default Interaction;
