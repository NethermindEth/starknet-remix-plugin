import { useEffect, useState } from "react";
import { Card } from "../Card";

import "./styles.css";

interface CompilationTabProps {
  remixClient?: any;
  onContractChange?: any;
  onConstructorInputsChange?: any;
}

function CompilationTab(props: CompilationTabProps) {
  const [currentFileName, setCurrentFileName] = useState("");
  const [isCompilingToSierra, setIsCompilingToSierraStatus] = useState(false);
  const [isCompilingToCasm, setIsCompilingToCasmStatus] = useState(false);
  const [isValidCairo, setIsValidCairo] = useState(false);
  const [isValidSierra, setIsValidSierra] = useState(false);

  const { remixClient } = props;

  useEffect(() => {
    // setTimeout(() => {
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
    // }, 1000);
  }, [remixClient]);

  useEffect(() => {
    console.log("isCompilingToSierra", isCompilingToSierra);
  }, [isCompilingToSierra]);

  // Dummy, check for errors.
  const getFile = async () => {
    const currentFilePath = await remixClient.call(
      "fileManager",
      "getCurrentFile",
      currentFileName
    );

    const currentFileContent = await remixClient.call(
      "fileManager",
      "readFile",
      currentFilePath
    );

    return { currentFileContent, currentFilePath };
  };

  let artifactFolder = (path: string) => {
    if (path.includes("artifacts"))
      return path.split("/").slice(0, -1).join("/");
    return path.split("/").slice(0, -1).join("/").concat("/artifacts");
  };

  let artifactFileName = (ext: ".json" | ".casm") =>
    currentFileName.split(".")[0].concat(ext);

  async function compileToSierra() {
    setIsCompilingToSierraStatus(true);
    await compileTo("sierra");
    setIsCompilingToSierraStatus(false);
  }

  async function compileToCasm() {
    setIsCompilingToCasmStatus(true);
    await compileTo("casm");
    setIsCompilingToCasmStatus(false);
  }

  async function compileTo(lang: string) {
    let { currentFileContent, currentFilePath } = await getFile();

    // TODO: Fail gracefully, implement interaction.

    const response = await fetch(
      `http://127.0.0.1:8000/compile-to-${
        lang === "sierra" ? "sierra" : "casm"
      }`,
      {
        method: "POST",
        body: currentFileContent,
        redirect: "follow",
        headers: {
          "Content-Type": "application/octet-stream",
        },
      }
    );

    let fileContent = await response.text();
    let newFilePath = `${artifactFolder(currentFilePath)}/${artifactFileName(
      lang === "sierra" ? ".json" : ".casm"
    )}`;

    await remixClient.call("fileManager", "setFile", newFilePath, fileContent);

    remixClient.call("fileManager", "switchFile", newFilePath);
  }

  const compilationCard = (
    header: string,
    validation: boolean,
    isLoading: boolean,
    onClick: () => {}
  ) => {
    return (
      <Card header={header}>
        <button
          className="btn btn-primary btn-block d-block w-100 text-break remixui_disabled mb-1 mt-1"
          style={{
            cursor: `${
              !validation || !currentFileName ? "not-allowed" : "pointer"
            }`,
          }}
          aria-disabled={!validation || !currentFileName}
          onClick={onClick}
        >
          <div className="d-flex align-items-center justify-content-center">
            <div className="text-truncate overflow-hidden text-nowrap">
              {!validation ? (
                <span>Not a valid file</span>
              ) : (
                <>
                  <div className="d-flex align-items-center justify-content-center">
                    {isLoading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm"
                          role="status"
                          aria-hidden="true"
                        >
                          {" "}
                        </span>
                        <span style={{ paddingLeft: "0.5rem" }}>
                          Compiling...
                        </span>
                      </>
                    ) : (
                      <div className="text-truncate overflow-hidden text-nowrap">
                        <span>Compile</span>
                        <span className="ml-1 text-nowrap">
                          {currentFileName}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </button>
      </Card>
    );
  };

  const compilations = [
    {
      header: "Compile to Sierra",
      validation: isValidCairo,
      isLoading: isCompilingToSierra,
      onClick: compileToSierra,
    },
    {
      header: "Compile to Casm",
      validation: isValidSierra,
      isLoading: isCompilingToCasm,
      onClick: compileToCasm,
    },
  ];

  return (
    <div>
      {compilations.map((compilation) => {
        return compilationCard(
          compilation.header,
          compilation.validation,
          compilation.isLoading,
          compilation.onClick
        );
      })}
    </div>
  );
}

export default CompilationTab;
