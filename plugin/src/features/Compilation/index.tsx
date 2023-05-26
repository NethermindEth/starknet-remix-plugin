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
    setTimeout(() => {
      remixClient.on(
        "fileManager",
        "currentFileChanged",
        (currentFileChanged: any) => {
          const filename = getFileNameFromPath(currentFileChanged);
          const currentFileExtension = getFileExtension(filename);
          setIsValidCairo(currentFileExtension === "cairo");
          setCurrentFilename(filename);
        }
      );
    }, 10);
  }, [remixClient]);

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
    try {
      let { currentFileContent, currentFilePath } = await getFile();

      console.log(currentFileContent, currentFilePath);

      let response = await fetch(`${apiUrl}/compile-to-sierra`, {
        method: "POST",
        body: currentFileContent,
        redirect: "follow",
        headers: {
          "Content-Type": "application/octet-stream",
        },
      });

      if (!response.ok) {
        remixClient.call('notification' as any, 'toast', 'Could not reach cairo compilation server');
        throw new Error("Cairo Compilation Request Failed");
      }

      // get Json body from response
      const sierra = JSON.parse(await response.text());

      if (sierra.status !== "Success") {
        remixClient.terminal.log(sierra.message);

        // trim sierra message to get last line
        const lastLine = sierra.message.trim().split("\n").pop().trim();

        remixClient.emit("statusChanged", {
          key: "failed",
          type: "error",
          title: lastLine.startsWith("Error") ? lastLine : "Compilation Failed",
        });
        throw new Error(
          "Cairo Compilation Failed with message: " + sierra.message
        );
      }

      response = await fetch(`${apiUrl}/compile-to-casm`, {
        method: "POST",
        body: sierra.file_content,
        redirect: "follow",
        headers: {
          "Content-Type": "application/octet-stream",
        },
      });

      // get Json body from response
      const casm = JSON.parse(await response.text());

      if (casm.status !== "Success") {
        remixClient.terminal.log(casm.message);

        const lastLine = casm.message.trim().split("\n").pop().trim();

        remixClient.emit('statusChanged', {
          key: 'failed',
          type: 'error',
          title: lastLine ?? 'Sierra Compilation Failed',
        });
        throw new Error(
          "Sierra Cairo Compilation Failed with message: " + sierra.message
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

      storeContract(currentFilename, currentFilePath, sierra.file_content, casm.file_content);

      remixClient.emit('statusChanged', {
        key: 'succeed',
        type: 'success',
        title: 'Cheers : last cairo compilation was succeessful',
      });

      remixClient.call('notification' as any, 'toast', `Cairo compilation output written to: ${sierraPath} `);
      remixClient.terminal.log(sierra.file_content);

      try {
        await remixClient.call("fileManager", "writeFile", sierraPath, sierra.file_content);
        await remixClient.call("fileManager", "writeFile", casmPath, casm.file_content);
      } catch (e) {
        if (e instanceof Error)
        remixClient.call("notification" as any, "toast", e.message + " try deleting the files: " + sierraPath + " and " + casmPath);
        console.error(e);
      }

    } catch (e) {
      if (e instanceof Error)
        remixClient.call("notification" as any, "toast", e.message);
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
