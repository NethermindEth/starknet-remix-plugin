import { useContext, useEffect, useState } from "react";
import { Card } from "../../components/Card";

import { CompiledContractsContext } from "../../contexts/CompiledContractsContext";
import { RemixClientContext } from "../../contexts/RemixClientContext";
import { apiUrl } from "../../utils/network";
import {
  artifactFilename,
  artifactFolder,
  getFileExtension,
  getFileNameFromPath,
} from "../../utils/utils";
import "./styles.css";
import { hash } from "starknet";

interface CompilationProps {
  setIsLatestClassHashReady: (isLatestClassHashReady: boolean) => void;
}

function Compilation({ setIsLatestClassHashReady }: CompilationProps) {
  const remixClient = useContext(RemixClientContext);

  const { contracts, setContracts, setSelectedContract } = useContext(
    CompiledContractsContext
  );

  const [currentFilename, setCurrentFilename] = useState("");
  const [isCompiling, setIsCompiling] = useState(false);
  const [isValidCairo, setIsValidCairo] = useState(false);

  useEffect(() => {
    setTimeout(async () => {
      // get current file
      const currentFile = await remixClient.fileManager.getCurrentFile();
      if (currentFile) {
        const filename = getFileNameFromPath(currentFile);
        const currentFileExtension = getFileExtension(filename);
        setIsValidCairo(currentFileExtension === "cairo");
        setCurrentFilename(filename);

        console.log("current File: ", currentFilename);
      }
    }, 10);
  }, [remixClient, currentFilename]);

  useEffect(() => {
    setTimeout(async () => {
      remixClient.on(
        "fileManager",
        "currentFileChanged",
        (currentFileChanged: any) => {
          const filename = getFileNameFromPath(currentFileChanged);
          const currentFileExtension = getFileExtension(filename);
          setIsValidCairo(currentFileExtension === "cairo");
          setCurrentFilename(filename);
          console.log("current File here: ", currentFilename);
        }
      );
    }, 10);
  }, [remixClient, currentFilename]);


  useEffect( () => {
    setTimeout(async () => {
      let { currentFileContent, currentFilePath } = await getFile();
      await fetch(`${apiUrl}/save_code/${currentFilePath}`, {
        method: "POST",
        body: currentFileContent,
        redirect: "follow",
        headers: {
          "Content-Type": "application/octet-stream",
        },
      });
    }, 100)
  }, [currentFilename, remixClient]);

  const compilations = [
    {
      header: "Compile",
      validation: isValidCairo,
      isLoading: isCompiling,
      onClick: compile,
    },
  ];

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

  async function compile() {
    setIsCompiling(true);
    // clear current FIle annotations
    await remixClient.editor.clearAnnotations();
    try {
      let { currentFileContent, currentFilePath } = await getFile();

      // console.log(currentFileContent, currentFilePath);

      let response = await fetch(`${apiUrl}/save_code/${currentFilePath}`, {
        method: "POST",
        body: currentFileContent,
        redirect: "follow",
        headers: {
          "Content-Type": "application/octet-stream",
        },
      });

      if (!response.ok) {
        remixClient.call(
          "notification" as any,
          "toast",
          "Could not reach cairo compilation server"
        );
        throw new Error("Cairo Compilation Request Failed");
      }

      response = await fetch(`${apiUrl}/compile-to-sierra/${currentFilePath}`, {
        method: "GET",
        redirect: "follow",
        headers: {
          "Content-Type": "text/plain",
        },
      });

      if (!response.ok) {
        remixClient.call(
          "notification" as any,
          "toast",
          "Could not reach cairo compilation server"
        );
        throw new Error("Cairo Compilation Request Failed");
      }

      // get Json body from response
      const sierra = JSON.parse(await response.text());

      if (sierra.status !== "Success") {
        remixClient.terminal.log(sierra.message);

        const errorLets = sierra.message.trim().split("\n");

        // remove last element if it's starts with `Error:`
        if (errorLets[errorLets.length - 1].startsWith("Error:")) {
          errorLets.pop();
        }

        // break the errorLets in array of arrays with first element contains the string `Plugin diagnostic`
        const errorLetsArray = errorLets.reduce((acc: any, curr: any) => {
          if (curr.startsWith("error:") || curr.startsWith("warning:")) {
            acc.push([curr]);
          } else {
            acc[acc.length - 1].push(curr);
          }
          return acc;
        }, [['errors diagnostic:']]);

        // remove the first array 
        errorLetsArray.shift();

        console.log(errorLetsArray);

        errorLetsArray.forEach(async (errorLet: any) => {
          const errorType = errorLet[0].split(":")[0].trim();
          const errorTitle = errorLet[0].split(":").slice(1).join(":").trim();
          const errorLine = errorLet[1].split(":")[1].trim();
          const errorColumn = errorLet[1].split(":")[2].trim();
          // join the rest of the array
          const errorMsg = errorLet.slice(2).join("\n");

          console.log({
            row: Number(errorLine) -1, 
            column: Number(errorColumn) -1,
            text: errorMsg + "\n" + errorTitle,
            type: errorType,
          });

          await remixClient.editor.addAnnotation({
            row: Number(errorLine)- 1, 
            column: Number(errorColumn) -1,
            text: errorMsg + "\n" + errorTitle,
            type: errorType,
          });
        });

        // trim sierra message to get last line
        const lastLine = sierra.message.trim().split("\n").pop().trim();

        remixClient.emit("statusChanged", {
          key: "failed",
          type: "error",
          title: lastLine.startsWith("Error") ? lastLine : "Compilation Failed",
        });
        throw new Error(
          "Cairo Compilation Failed, logs can be read in the terminal log"
        );
      }

      response = await fetch(
        `${apiUrl}/compile-to-casm/${currentFilePath.replace(
          getFileExtension(currentFilePath),
          "sierra"
        )}`,
        {
          method: "GET",
          redirect: "follow",
          headers: {
            "Content-Type": "text/plain",
          },
        }
      );

      if (!response.ok) {
        remixClient.call(
          "notification" as any,
          "toast",
          "Could not reach cairo compilation server"
        );
        throw new Error("Cairo Compilation Request Failed");
      }

      // get Json body from response
      const casm = JSON.parse(await response.text());

      if (casm.status !== "Success") {
        remixClient.terminal.log(casm.message);

        const lastLine = casm.message.trim().split("\n").pop().trim();

        remixClient.emit("statusChanged", {
          key: "failed",
          type: "error",
          title: lastLine ?? "Sierra Compilation Failed",
        });
        throw new Error(
          "Sierra Cairo Compilation Failed, logs can be read in the terminal log"
        );
      }

      let sierraPath = `${artifactFolder(currentFilePath)}/${artifactFilename(
        ".json",
        currentFilename
      )}`;
      let casmPath = `${artifactFolder(currentFilePath)}/${artifactFilename(
        ".casm",
        currentFilename
      )}`;

      storeContract(
        currentFilename,
        currentFilePath,
        sierra.file_content,
        casm.file_content
      );

      remixClient.emit("statusChanged", {
        key: "succeed",
        type: "success",
        title: "Cheers : last cairo compilation was succeessful",
      });

      remixClient.terminal.log(sierra.file_content);

      try {
        await remixClient.call(
          "fileManager",
          "writeFile",
          sierraPath,
          sierra.file_content
        );
        await remixClient.call(
          "fileManager",
          "writeFile",
          casmPath,
          casm.file_content
        );
      } catch (e) {
        if (e instanceof Error)
          remixClient.call(
            "notification" as any,
            "toast",
            e.message +
              " try deleting the files: " +
              sierraPath +
              " and " +
              casmPath
          );
        throw e;
      }

      remixClient.fileManager.open(sierraPath);

      remixClient.call(
        "notification" as any,
        "toast",
        `Cairo compilation output written to: ${sierraPath} `
      );
    } catch (e) {
      if (e instanceof Error)
        remixClient.call("notification" as any, "alert", {
          id: "starknetRemixPluginAlert",
          title: "Expectation Failed", 
          message: e.message,
        });
      console.error(e);
    }
    setIsCompiling(false);
  }

  async function storeContract(
    contractName: string,
    path: string,
    sierraFile: string,
    casmFile: string
  ) {
    setIsLatestClassHashReady(true);
    try {
      const sierra = await JSON.parse(sierraFile);
      const casm = await JSON.parse(casmFile);
      const classHash = hash.computeCompiledClassHash(casm);
      const contract = {
        name: contractName,
        abi: sierra.abi,
        classHash,
        sierra,
        casm,
        path,
        deployed: false,
        address: "",
      };
      setSelectedContract(contract);
      setContracts([...contracts, contract]);
    } catch (e) {
      console.error(e);
    }
    setIsLatestClassHashReady(false);
  }

  const compilationCard = (
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
          disabled={!validation || !currentFilename}
          aria-disabled={!validation || !currentFilename}
          onClick={onClick}
        >
          <div className="d-flex align-items-center justify-content-center">
            <div className="text-truncate overflow-hidden text-nowrap">
              {!validation ? (
                <span>Not a valid cairo file</span>
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

export default Compilation;
