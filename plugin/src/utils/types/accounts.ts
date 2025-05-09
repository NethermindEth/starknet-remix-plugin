import { type BigNumberish } from "ethers";

interface DevnetAccount {
	balance: number;
	initial_balance: number;
	address: string;
	private_key: string;
	public_key: string;
}

interface ManualAccount {
	address: string;
	private_key: string;
	public_key: string;
	balance: BigNumberish;
	deployed_networks: string[];
}

export type { DevnetAccount, ManualAccount };
