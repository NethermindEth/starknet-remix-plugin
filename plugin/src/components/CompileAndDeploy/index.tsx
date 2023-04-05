import { useContext, useEffect, useState } from "react";
import Compilation from "../../features/Compilation";
import Deployment from "../../features/Deployment";
import { RemixClientContext } from "../../contexts/RemixClientContext";

interface CompileAndDeployTabProps {}

function CompileAndDeploy(props: CompileAndDeployTabProps) {
  const remixClient = useContext(RemixClientContext);

  const [currentFileName, setCurrentFileName] = useState("");
  const [isValidCairo, setIsValidCairo] = useState(false);
  const [isValidSierra, setIsValidSierra] = useState(false);
  const [isCompiled, setIsCompiled] = useState(false);
  // TODO: make map contractName => classHash
  const [compiledContracts, setCompiledContracts] = useState<any>([]);

  useEffect(() => {
    setTimeout(() => {
      remixClient.on(
        "fileManager",
        "currentFileChanged",
        (currentFileChanged: any) => {
          const fileName = currentFileChanged.split("/").pop();
          const currentFileExtension = fileName.split(".").pop() || "";
          setIsValidCairo(currentFileExtension === "cairo");
          setIsValidSierra(currentFileExtension === "json");
          setCurrentFileName(fileName);
          console.log(fileName);
        }
      );
    }, 10);
  }, [remixClient]);

  return (
    <>
      <Compilation setIsCompiled={setIsCompiled} />
      <Deployment
        fileInfo={{
          fileName: currentFileName,
          isValidCairo,
          isValidSierra,
        }}
        isCompiled={isCompiled}
      />
    </>
  );
}

export default CompileAndDeploy;
