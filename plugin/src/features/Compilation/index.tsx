import { useContext, useEffect, useState } from "react";
import { Card } from "../../components/Card";

import { RemixClientContext } from "../../contexts/RemixClientContext";
import { apiUrl } from "../../utils/provider";
import "./styles.css";
import {
  artifactFilename,
  artifactFolder,
  getFileExtension,
  getFileNameFromPath,
} from "../../utils/utils";

interface CompilationTabProps {
  setIsCompiled: (isCompiled: boolean) => void;
}

function CompilationTab({ setIsCompiled }: CompilationTabProps) {
  const remixClient = useContext(RemixClientContext);

  const [currentFilename, setCurrentFilename] = useState("");
  const [isCompiling, setIsCompiling] = useState(false);
  // const [isCompilingToSierra, setIsCompilingToSierraStatus] = useState(false);
  // const [isCompilingToCasm, setIsCompilingToCasmStatus] = useState(false);
  const [isValidCairo, setIsValidCairo] = useState(false);
  // const [isValidSierra, setIsValidSierra] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      remixClient.on(
        "fileManager",
        "currentFileChanged",
        (currentFileChanged: any) => {
          const filename = getFileNameFromPath(currentFileChanged);
          const currentFileExtension = getFileExtension(filename);
          setIsValidCairo(currentFileExtension === "cairo");
          // setIsValidSierra(currentFileExtension === "json");
          setCurrentFilename(filename);
        }
      );
    }, 10);
  }, [remixClient]);

  // User might want to modify sierra and compile it.
  // TODO: Add this in advanced features.
  const compilations = [
    {
      header: "Compile",
      validation: isValidCairo,
      isLoading: isCompiling,
      onClick: compile,
    },
    // {
    //   header: "Compile to Sierra",
    //   validation: isValidCairo,
    //   isLoading: isCompilingToSierra,
    //   onClick: compileToSierra,
    // },
    // {
    //   header: "Compile to Casm",
    //   validation: isValidSierra,
    //   isLoading: isCompilingToCasm,
    //   onClick: compileToCasm,
    // },
  ];

  // Check for errors.
  const getFile = async () => {
    const currentFilePath = await remixClient.call(
      "fileManager",
      "getCurrentFile"
    );

    const currentFileContent = await remixClient.call(
      "fileManager",
      "readFile",
      currentFilePath
    );

    return { currentFileContent, currentFilePath };
  };

  // async function compileToSierra() {
  //   setIsCompilingToSierraStatus(true);
  //   await compileTo("sierra");
  //   setIsCompilingToSierraStatus(false);
  // }

  // async function compileToCasm() {
  //   setIsCompilingToCasmStatus(true);
  //   await compileTo("casm");
  //   setIsCompilingToCasmStatus(false);
  // }

  async function compile() {
    setIsCompiling(true);
    let { currentFileContent, currentFilePath } = await getFile();
    let response = await fetch(`${apiUrl}/compile-to-sierra`, {
      method: "POST",
      body: currentFileContent,
      redirect: "follow",
      headers: {
        "Content-Type": "application/octet-stream",
      },
    });

    const sierra = await response.text();

    response = await fetch(`${apiUrl}/compile-to-casm`, {
      method: "POST",
      body: sierra,
      redirect: "follow",
      headers: {
        "Content-Type": "application/octet-stream",
      },
    });

    const casm = await response.text();

    let sierraPath = `${artifactFolder(currentFilePath)}/${artifactFilename(
      ".json",
      currentFilename
    )}`;
    let casmPath = `${artifactFolder(currentFilePath)}/${artifactFilename(
      ".casm",
      currentFilename
    )}`;

    await remixClient.call("fileManager", "setFile", sierraPath, sierra);
    await remixClient.call("fileManager", "setFile", casmPath, casm);

    remixClient.call("fileManager", "switchFile", sierraPath);
    setIsCompiled(true);
    setIsCompiling(false);
  }

  // async function compileTo(lang: string) {
  //   let { currentFileContent, currentFilePath } = await getFile();

  //   // TODO: Fail gracefully, implement interaction.

  //   const response = await fetch(
  //     `${compilationEndpoint}/compile-to-${
  //       lang === "sierra" ? "sierra" : "casm"
  //     }`,
  //     {
  //       method: "POST",
  //       body: currentFileContent,
  //       redirect: "follow",
  //       headers: {
  //         "Content-Type": "application/octet-stream",
  //       },
  //     }
  //   );

  //   let fileContent = await response.text();
  //   let newFilePath = `${artifactFolder(currentFilePath)}/${artifactFilename(
  //     lang === "sierra" ? ".json" : ".casm"
  //   )}`;

  //   await remixClient.call("fileManager", "setFile", newFilePath, fileContent);

  //   remixClient.call("fileManager", "switchFile", newFilePath);
  // }

  const Compilation = (
    header: string,
    validation: boolean,
    isLoading: boolean,
    onClick: () => {}
  ) => {
    return (
      <Card header={header} key={header}>
        <button
          className="btn btn-primary btn-block d-block w-100 text-break remixui_disabled mb-1 mt-1"
          style={{
            cursor: `${
              !validation || !currentFilename ? "not-allowed" : "pointer"
            }`,
          }}
          aria-disabled={!validation || !currentFilename}
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
                          {currentFilename}
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

  return (
    <div>
      {compilations.map((compilation) => {
        return Compilation(
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
