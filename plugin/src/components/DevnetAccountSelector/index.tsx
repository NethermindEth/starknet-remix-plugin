// A component that reads the compiled contracts from the context and displays them in a select

import { useContext } from "react";
import { DevnetContext } from "../../contexts/DevnetContext";
import {
  getRoundedNumber,
  getSelectedAccountIndex,
  getShortenedHash,
  weiToEth
} from "../../utils/utils";

interface DevnetAccountSelectorProps {}

function DevnetAccountSelector(props: DevnetAccountSelectorProps) {
  const { availableAccounts, selectedAccount, setSelectedAccount } =
    useContext(DevnetContext);

  function handleAccountChange(event: any) {
    setSelectedAccount(availableAccounts[event.target.value]);
  }

  return (
    <select
      className="custom-select"
      aria-label=".form-select-sm example"
      onChange={handleAccountChange}
      defaultValue={getSelectedAccountIndex(availableAccounts, selectedAccount)}
    >
      {availableAccounts.map((account, index) => {
        return (
          <option value={index} key={index}>
            {`${getShortenedHash(
              account.address || "",
              6,
              4
            )} (${getRoundedNumber(weiToEth(account.initial_balance), 2)} ether)`}
          </option>
        );
      })}
    </select>
  );
}

export default DevnetAccountSelector;
