import FormData from "form-data";
import { ChangeEvent, useContext, useEffect, useState } from "react";

import { CompiledContractsContext } from "../../contexts/CompiledContractsContext";
import { ConnectionContext } from "../../contexts/ConnectionContext";
import { Network, licenses } from "../../utils/constants";
import { getExplorerUrl } from "../../utils/utils";
import { Card } from "../Card";
import "./styles.css";
import axios, { AxiosError } from "axios";
import { RemixClientContext } from "../../contexts/RemixClientContext";

interface VerifyProps {}

function Verify(props: VerifyProps) {
  const [isAccountContract, setIsAccountContract] = useState(false);
  const [license, setLicense] = useState(licenses[0]);
  const [isVerifiying, setIsVerifiying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [verifyError, setVerifyError] = useState<AxiosError>();
  const [explorer, setExplorer] = useState(getExplorerUrl("goerli-alpha"));

  const { selectedContract: contract } = useContext(CompiledContractsContext);
  const {
    connection: { network },
  } = useContext(ConnectionContext);
  const { fileManager } = useContext(RemixClientContext);

  useEffect(() => {
    setExplorer(getExplorerUrl(network as Network));
  }, [network]);

  const handleLicenseChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setLicense(e.target.value);
  };

  const getFiles = async (paths: string[]) => {
    const contentPromises = paths.map(async (path) => {
      return { path, content: fileManager.readFile(path) };
    });
    const fileContents = await Promise.all(contentPromises);
    return fileContents;
  };

  const handleVerify = async () => {
    setIsVerifiying(true);
    const body = new FormData();
    // This should be a variable, modify when diferent compilers are supported.
    body.append("compiler-version", "0.11.0");
    body.append("license", license);
    body.append("account-contract", isAccountContract.toString());
    body.append("name", contract?.name);
    body.append("contract-name", contract?.name);
    // While Scarb solution gets implemented
    body.append(
      "code",
      (await getFiles([contract?.path as string]))[0].content
    );
    // Array.from({ length: files.length }).forEach((_, index) => {
    //   body.append(`file${index}`, files[index].content, {
    //     filename: files[index].path,
    //     filepath: files[index].path,
    //   });
    // });
    console.log(body);
    try {
      const result = await axios({
        method: "post",
        url: `${explorer}/api/contract/${contract?.classHash}/code`,
        data: body,
        headers: {
          "Content-Type": `multipart/form-data`,
        },
      });
      setIsVerifiying(false);
      setVerifyResult(result.data);
    } catch (error: any) {
      setVerifyError(error);
      console.log(error);
      setIsVerifiying(false);
      throw new Error(error.response.data.message);
    }
  };

  return (
    <>
      {!!contract && (
        <Card header="Verify in Voyager">
          <div className="Verify">
            <div className="form-select">
              <label>License: </label>
              <select
                className="custom-select"
                defaultValue={license}
                onChange={handleLicenseChange}
              >
                {licenses.map((license, index) => {
                  return (
                    <option value={license} key={index}>
                      {license}
                    </option>
                  );
                })}
              </select>
            </div>
            <div
              className="custom-control custom-checkbox mt-2"
              onClick={() => setIsAccountContract(!isAccountContract)}
            >
              <input
                className="custom-control-input"
                type="checkbox"
                checked={isAccountContract}
              />
              <label className="form-check-label custom-control-label">
                Account Contract
              </label>
            </div>

            <button
              className="btn btn-primary btn-block d-block w-100 text-break remixui_disabled mb-1 mt-3"
              style={{
                cursor: `${!contract.deployed ? "not-allowed" : "pointer"}`,
              }}
              disabled={!contract.deployed}
              aria-disabled={!contract.deployed}
              onClick={handleVerify}
            >
              <div className="d-flex align-items-center justify-content-center">
                {isVerifiying ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    >
                      {" "}
                    </span>
                    <span style={{ paddingLeft: "0.5rem" }}>Verifying...</span>
                  </>
                ) : (
                  <div className="text-truncate overflow-hidden text-nowrap">
                    <span>Verify</span>
                    <span className="ml-1 text-nowrap">{contract.name}</span>
                  </div>
                )}
              </div>
            </button>

            {!contract.deployed && (
              <label className="mt-2">
                Kindly deploy your contract first before verifying it.
              </label>
            )}
            {contract && verifyError && (
              <label className="mt-2">
                There was an error verifying your contract, check that the class
                is declared{" "}
                <a href={`${explorer}/class/${contract?.classHash}`}>here</a>.
              </label>
            )}
            {verifyResult && (
              <label className="mt-2">
                Your contract has been verified, check it{" "}
                <a href={`${explorer}/class/${contract?.classHash}`}>here</a>.
              </label>
            )}
          </div>
        </Card>
      )}
    </>
  );
}

export default Verify;
