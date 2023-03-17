// A navigation bar that allows to navigate between the different pages of the app: the Compiles, the Deploy, the Interact and the Verify pages

import { useState } from "react";
import Compilation from "../Compilation";
import Deploy from "../Deploy";
// import CompilationTab from "../Interact";
// import CompilationTab from "../Verify";

import "./styles.css";

interface NavProps {
  remixClient?: any;
  onContractChange?: any;
  onConstructorInputsChange?: any;
}

function Nav(props: NavProps) {
  const { remixClient } = props;

  const [activeTab, setActiveTab] = useState("compile");

  return (
    <div>
      <ul className="nav nav-tabs" style={{ borderBottom: "none" }}>
        <li
          className={`nav-link nav-item ${
            activeTab === "compile" ? "active" : ""
          }`}
          onClick={() => setActiveTab("compile")}
        >
          Compile & deploy
        </li>
        {/* <li
          className={`nav-link nav-item ${
            activeTab === "deploy" ? "active" : ""
          }`}
          onClick={() => setActiveTab("deploy")}
        >
          Deploy
        </li> */}
        <li
          className={`nav-link nav-item ${
            activeTab === "interact" ? "active" : ""
          }`}
          onClick={() => setActiveTab("interact")}
        >
          Interact
        </li>
        {/* <li
          className={`nav-link nav-item ${
            activeTab === "verify" ? "active" : ""
          }`}
          onClick={() => setActiveTab("verify")}
        >
          Verify
        </li> */}
      </ul>
      <div className="tab-content">
        <div
          className={`tab-pane ${activeTab === "compile" ? "active" : ""}`}
          id="compile"
        >
          {activeTab === "compile" && <Compilation remixClient={remixClient} />}
        </div>
        <div
          className={`tab-pane ${activeTab === "deploy" ? "active" : ""}`}
          id="deploy"
        >
          {activeTab === "deploy" && <Deploy />}
        </div>
        {/* <div
          className={`tab-pane ${activeTab === "interact" ? "active" : ""}`}
          id="interact"
        >
          {activeTab === "interact" && <CompilationTab />}
        </div>
        <div
          className={`tab-pane ${activeTab === "verify" ? "active" : ""}`}
          id="verify"
        >
          {activeTab === "verify" && <CompilationTab />}
        </div> */}
      </div>
    </div>
  );
}

export default Nav;
