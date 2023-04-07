import { useContext, useEffect, useState } from "react";
import { Card } from "../../components/Card";
import CompiledContracts from "../../components/CompiledContracts";
import { CompiledContractsContext } from "../../contexts/CompiledContractsContext";
import { AbiElement } from "../../types/contracts";
import { getReadFunctions, getWriteFunctions } from "../../utils/utils";

interface InteractionProps {}

function Interaction(props: InteractionProps) {
  const [readFunctions, setReadFunctions] = useState<AbiElement[]>([]);
  const [writeFunctions, setWriteFunctions] = useState<AbiElement[]>([]);
  const { contracts, selectedContract } = useContext(CompiledContractsContext);

  useEffect(() => {
    if (selectedContract) {
      const readFunctions = getReadFunctions(selectedContract?.abi);
      const writeFunctions = getWriteFunctions(selectedContract?.abi);
      console.log("Read Functions", readFunctions);
      console.log("Write Functions", writeFunctions);

      setReadFunctions(readFunctions);
      setWriteFunctions(writeFunctions);
    }
  }, [selectedContract]);

  return (
    <Card header="Interaction">
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
          >
            <button className="udapp_instanceButton undefined btn btn-sm btn-warning w-50">
              {func.name}
            </button>
            <div className="function-inputs w-50">
              {func.inputs.length > 0 &&
                func.inputs.map((input, index) => {
                  return (
                    <input
                      className="form-control function-input"
                      name={func.name}
                      data-type={func.type}
                      data-index={index}
                      placeholder={input.name}
                      // value={constructorCalldata[index]?.value || ""}
                      // onChange={handleConstructorCalldataChange}
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
          >
            <button className="udapp_instanceButton undefined btn btn-sm btn-info w-50">
              {func.name}
            </button>
            <div className="function-inputs w-50">
              {func.inputs.length > 0 &&
                func.inputs.map((input, index) => {
                  return (
                    <input
                      className="form-control function-input"
                      name={func.name}
                      data-type={func.type}
                      data-index={index}
                      placeholder={input.name}
                      // value={constructorCalldata[index]?.value || ""}
                      // onChange={handleConstructorCalldataChange}
                    />
                  );
                })}
            </div>
          </div>
        );
      })}
    </Card>
  );
}

export default Interaction;
