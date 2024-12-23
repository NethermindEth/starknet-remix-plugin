import { type AccountInterface, type ProviderInterface } from "starknet";

export interface Transaction {
	type: "deploy" | "declare" | "invoke" | "deployAccount";
	txId: string;
	env: string;
	account: AccountInterface | null;
	provider: ProviderInterface | null;
}
