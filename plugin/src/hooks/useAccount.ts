import type React from "react";
import { type AccountInterface } from "starknet";

import { account as atomAccount } from "../atoms/connection";
import { useAtom } from "jotai";

const useAccount = (): {
	account: AccountInterface | null;
	setAccount: React.Dispatch<React.SetStateAction<AccountInterface | null>>;
} => {
	const [account, setAccount] = useAtom(atomAccount);
	return { account, setAccount };
};

export default useAccount;
