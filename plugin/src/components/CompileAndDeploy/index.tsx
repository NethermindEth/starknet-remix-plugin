import { useState } from "react";
import Compilation from "../../features/Compilation";
import Deployment from "../../features/Deployment";
import { Card } from "../Card";
import Verify from "../Verify";

interface CompileAndDeployTabProps {}

function CompileAndDeploy(props: CompileAndDeployTabProps) {
  // TODO: This state should be moved to a context to survibe changing tabs.
  const [isLatestClassHashBeingLoaded, setIsLatestClassHashBeingLoaded] =
    useState(false);
  return (
    <div style={{ marginBottom: "161.5px" }}>
      <Compilation
        setIsLatestClassHashReady={setIsLatestClassHashBeingLoaded}
      />
      {isLatestClassHashBeingLoaded && (
        <Card>
          <div className="flex d-flex align-items-center justify-content-center">
            <div className="spinner-border" role="status">
              <span className="sr-only">Loading...</span>
            </div>
            <span className="ml-2">
              Getting the Class Hash of the contract...
            </span>
          </div>
          <p className="mt-3">
            Feel free to explore the compiled Sierra file in the meantime.
          </p>
        </Card>
      )}
      <Deployment />
      <Verify />
    </div>
  );
}

export default CompileAndDeploy;
