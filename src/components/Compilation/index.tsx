// Component that shows the CompileToSierra and CompileToCasm components

import { useEffect, useState } from "react";

import "./styles.css";

interface CompilationTabProps {
  remixClient?: any;
  onContractChange?: any;
  onConstructorInputsChange?: any;
}

function CompilationTab(props: CompilationTabProps) {
  const [currentFileName, setCurrentFileName] = useState("");
  const [noFileSelected, setNoFileSelected] = useState(false);
  const [compiling, setCompilingStatus] = useState(false);

  const { remixClient } = props;

  useEffect(() => {
    setTimeout(() => {
      remixClient.on(
        "fileManager",
        "currentFileChanged",
        (currentFileChanged: any) => {
          console.log(currentFileChanged);
          const fileName = currentFileChanged.split("/").pop();
          const currentFileExtension = fileName.split(".").pop() || "";
          setNoFileSelected(currentFileExtension !== "cairo");
          setCurrentFileName(fileName);
        }
      );
    }, 1000);
  }, [remixClient]);

  function compileToSierra() {
    setCompilingStatus(true);
    // remixClient.call("cairo", "cairo-compile", currentFileName);
    setCompilingStatus(false);
  }

  function compileToCasm() {
    setCompilingStatus(true);
    // remixClient.call("cairo", "sierra-compile", currentFileName);
    setCompilingStatus(false);
  }

  return (
    <div>
      <div className="border-top border-bottom">
        <div className="card-header">
          <h5 className="mb-0">Compile to Sierra</h5>
        </div>
        <div className="card-body">
          <button
            className="btn btn-primary btn-block d-block w-100 text-break remixui_disabled mb-1 mt-1"
            aria-disabled={noFileSelected || !currentFileName}
            onClick={compileToSierra}
          >
            <div className="d-flex align-items-center justify-content-center">
              <div className="text-truncate overflow-hidden text-nowrap">
                <span>Compile</span>
                <span className="ml-1 text-nowrap">{currentFileName}</span>
              </div>
            </div>
          </button>
        </div>
      </div>
      <div className="border-top border-bottom">
        <div className="card-header">
          <h5 className="mb-0">Compile to Casm</h5>
        </div>
        <div className="card-body">
          <button
            className="btn btn-primary btn-block d-block w-100 text-break remixui_disabled mb-1 mt-1"
            aria-disabled={noFileSelected || !currentFileName}
            onClick={compileToCasm}
          >
            <div className="d-flex align-items-center justify-content-center">
              <div className="text-truncate overflow-hidden text-nowrap">
                <span>Compile</span>
                <span className="ml-1 text-nowrap">{currentFileName}</span>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default CompilationTab;
