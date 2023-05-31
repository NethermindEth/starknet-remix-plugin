// A component that reads the compiled contracts from the context and displays them in a select

import { useContext } from "react";
import { DevnetContext } from "../../contexts/DevnetContext";
import {
  getRoundedNumber,
  getSelectedAccountIndex,
  getShortenedHash,
  weiToEth,
} from "../../utils/utils";

interface DevnetAccountSelectorProps {}

function DevnetAccountSelector(_: DevnetAccountSelectorProps) {
  const {
    availableDevnetAccounts,
    selectedDevnetAccount,
    setSelectedDevnetAccount,
  } = useContext(DevnetContext);

  function handleAccountChange(event: any) {
    if (event.target.value === 0) {
      return;
    }
    setSelectedDevnetAccount(availableDevnetAccounts[event.target.value - 1]);
  }

  function getDefaultValue() {
    const index = getSelectedAccountIndex(
      availableDevnetAccounts,
      selectedDevnetAccount
    );
    if (
      index === -1 ||
      index === undefined ||
      index === null ||
      selectedDevnetAccount === null
    ) {
      return 0;
    }
    return index + 1;
  }

  return (
    <select
      className="custom-select"
      aria-label=".form-select-sm example"
      onChange={handleAccountChange}
      defaultValue={getDefaultValue()}
    >
      {availableDevnetAccounts.reduce(
        (acc, account, index) => {
          acc.push(
            <option value={index + 1} key={index + 1}>
              {`${getShortenedHash(
                account.address || "",
                6,
                4
              )} (${getRoundedNumber(
                weiToEth(account.initial_balance),
                2
              )} ether)`}
            </option>
          );
          return acc;
        },
        [
          <option value={0} key={0}>
            No accounts found
          </option>,
        ] as JSX.Element[]
      )}
    </select>
  );
}

export default DevnetAccountSelector;
