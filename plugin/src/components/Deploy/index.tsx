// A react component that allows to deploy to StarkNet with a button and a select input that selects the compiled contract
//

import "./styles.css";

interface DeployProps {
  remixClient?: any;
  onContractChange?: any;
  onConstructorInputsChange?: any;
}

function Deploy(props: DeployProps) {
  return (
    <div className="deploy">
      <button className="btn btn-primary btn-block d-block w-100 text-break remixui_disabled mb-1 mt-3">
        <div className="d-flex align-items-center justify-content-center">
          <div className="text-truncate overflow-hidden text-nowrap">
            <span>Deploy</span>
          </div>
        </div>
      </button>
    </div>
  );
}

export default Deploy;
