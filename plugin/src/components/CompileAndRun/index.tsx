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
        }
      );
    }, 10);
  }, [remixClient]);

  return (
    <>
      <Compilation remixClient={remixClient}></Compilation>
      <Deploy
        remixClient={remixClient}
        fileInfo={{ fileName: currentFileName, isValidCairo, isValidSierra }}
      ></Deploy>
    </>
  );
}

export default CompileAndRun;
