// A navigation bar that allows to navigate between the different pages of the app: the Compiles, the Deploy, the Interact and the Verify pages

import { useState } from "react";
import CompileAndRun from "../CompileAndRun";

import "./styles.css";
import { Interact } from "../Interact";

interface NavProps {
  remixClient?: any;
  onContractChange?: any;
  onConstructorInputsChange?: any;
}

function Nav(props: NavProps) {
  const { remixClient } = props;
  const [activeTab, setActiveTab] = useState("compile");
  // TODO: Move wallet connection info here or to a store.

  return (
    <div>
      <ul
        className="nav nav-tabs justify-content-center text-center m-0"
        style={{ borderBottom: "none" }}
      >
        <li
          className={`nav-link nav-item flex-fill ${
            activeTab === "compile" ? "active" : ""
          }`}
          onClick={() => setActiveTab("compile")}
        >
          Compile & deploy
        </li>
        <li
          className={`nav-link nav-item flex-fill ${
            activeTab === "interact" ? "active" : ""
          }`}
          onClick={() => setActiveTab("interact")}
        >
          Interact
        </li>
      </ul>
      <div className="tab-content">
        <div
          className={`tab-pane ${activeTab === "compile" ? "active" : ""}`}
          id="compile"
        >
          {activeTab === "compile" && (
            <CompileAndRun remixClient={remixClient} />
          )}
        </div>
        <div
          className={`tab-pane ${activeTab === "deploy" ? "active" : ""}`}
          id="interact"
        >
          {activeTab === "interact" && <Interact />}
        </div>
      </div>
    </div>
  );
}

export default Nav;
