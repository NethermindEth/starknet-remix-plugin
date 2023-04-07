import { useState } from "react";

import Interaction from "../../features/Interaction";
import CompileAndDeploy from "../CompileAndDeploy";
import "./styles.css";

interface NavProps {}

function Nav(props: NavProps) {
  const [activeTab, setActiveTab] = useState("compile");

  return (
    <>
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
          Compile & Deploy
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
          {activeTab === "compile" && <CompileAndDeploy />}
        </div>
        <div
          className={`tab-pane ${activeTab === "interact" ? "active" : ""}`}
          id="interact"
        >
          {activeTab === "interact" && <Interaction />}
        </div>
      </div>
    </>
  );
}

export default Nav;
