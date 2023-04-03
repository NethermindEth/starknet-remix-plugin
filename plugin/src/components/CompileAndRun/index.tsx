import { useEffect, useState } from "react";
import Compilation from "../Compilation";
import Deploy from "../Deploy";

interface CompileAndRunTabProps {
  remixClient?: any;
}

function CompileAndRun({ remixClient }: CompileAndRunTabProps) {
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
      <Compilation remixClient={remixClient} setIsCompiled={setIsCompiled} />
      <Deploy
        remixClient={remixClient}
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

export default CompileAndRun;
