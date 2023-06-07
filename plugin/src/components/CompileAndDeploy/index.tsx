import { useState } from "react";
import Compilation from "../../features/Compilation";
import Deployment from "../../features/Deployment";
import { Card } from "../Card";
import Verify from "../Verify";

import Accordian, {
  AccordianItem,
  AccordionTrigger,
  AccordionContent,
} from "../../ui_components/Accordian";
import Interaction from "../../features/Interaction";

interface CompileAndDeployTabProps {
  setActiveTab: (tab: AccordianTabs) => void;
}

export type AccordianTabs = "compile" | "deploy" | "interaction";

function CompileAndDeploy({ setActiveTab }: CompileAndDeployTabProps) {
  // TODO: This state should be moved to a context to survive changing tabs.
  const [isLatestClassHashBeingLoaded, setIsLatestClassHashBeingLoaded] =
    useState(false);

  const [currentAccordian, setCurrentAccordian] =
    useState<AccordianTabs>("compile");
  return (
    <div style={{ marginBottom: "220px" }}>
      <Accordian
        type="single"
        value={currentAccordian}
        defaultValue={"compile"}
      >
        <AccordianItem value="compile">
          <AccordionTrigger
            onClick={() => {
              setCurrentAccordian("compile");
            }}
          >
            Compile
          </AccordionTrigger>
          <AccordionContent>
            <Compilation
              setIsLatestClassHashReady={setIsLatestClassHashBeingLoaded}
            />
          </AccordionContent>
        </AccordianItem>
        <AccordianItem value="deploy">
          <AccordionTrigger
            onClick={() => {
              setCurrentAccordian("deploy");
            }}
          >
            Deploy
          </AccordionTrigger>
          <AccordionContent>
            <Deployment setActiveTab={setCurrentAccordian} />
          </AccordionContent>
        </AccordianItem>
        <AccordianItem value="interaction">
          <AccordionTrigger
            onClick={() => {
              setCurrentAccordian("interaction");
            }}
          >
            Interact
          </AccordionTrigger>
          <AccordionContent>
            <Interaction />
          </AccordionContent>
        </AccordianItem>
      </Accordian>

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

      {/* <Verify /> */}
    </div>
  );
}

export default CompileAndDeploy;
