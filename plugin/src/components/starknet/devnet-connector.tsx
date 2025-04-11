import React from "react";
import {
	type AddDeclareTransactionParameters,
	type AddInvokeTransactionParameters,
	Permission,
	type Call as RequestCall,
	type RequestFnCall,
	type RpcMessage,
	type RpcTypeToMessageMap,
	type TypedData,
} from "@starknet-io/types-js";
import {
	RpcProvider,
	type AccountInterface,
	type Call,
	type ProviderInterface,
} from "starknet";

import { Connector } from "@starknet-react/core";
import { nethermindDevnet } from "./nethermind-devnet";
import { devnetAccountAtom } from "../../atoms/connection";
import { useAtomValue } from "jotai";

export type MockConnectorOptions = {
	/** The wallet id. */
	id: string;
	/** Wallet human readable name. */
	name: string;
	/** Whether the connector is available for use. */
	available?: boolean;
	/** Whether the connector should fail to connect. */
	failConnect?: boolean;
	/** Include account when switching chain. */
	unifiedSwitchAccountAndChain?: boolean;
	/** Emit change account event when switching chain. */
	emitChangeAccountOnChainSwitch?: boolean;
	/** Reject request calls */
	rejectRequest?: boolean;
};

type ConnectorData = {
	/** Connector account. */
	account?: string;
	/** Connector network. */
	chainId?: bigint;
};

export class NethermindDevnetProvider extends RpcProvider {
	constructor(provider?: ProviderInterface) {
		super({
			nodeUrl: nethermindDevnet.rpcUrls.default.http[0],
			...provider,
		});
	}
}

// Store to manage account updates
export class DevnetAccountStore {
	private static instance: DevnetAccountStore;
	private listeners: Set<(account: AccountInterface | null) => void> = new Set();
	private currentAccount: AccountInterface | null = null;

	private constructor() {}

	static getInstance(): DevnetAccountStore {
		if (!DevnetAccountStore.instance) {
			DevnetAccountStore.instance = new DevnetAccountStore();
		}
		return DevnetAccountStore.instance;
	}

	subscribe(listener: (account: AccountInterface | null) => void): () => void {
		this.listeners.add(listener);
		listener(this.currentAccount);
		return () => this.listeners.delete(listener);
	}

	updateAccount(account: AccountInterface | null): void {
		this.currentAccount = account;
		this.listeners.forEach(listener => listener(account));
	}
}

export class NethermindDevnetConnector extends Connector {
	private _account: AccountInterface | null = null;
	private _chainId: bigint = BigInt(nethermindDevnet.id);
	private _connected: boolean = true;
	private _provider: ProviderInterface | null = null;
	private _unsubscribe: (() => void) | null = null;

	constructor() {
		super();
		this._provider = new NethermindDevnetProvider();

		// Subscribe to account changes through the store
		const store = DevnetAccountStore.getInstance();
		this._unsubscribe = store.subscribe((newAccount) => {
			this._account = newAccount;
		});
	}

	/** Cleanup subscription when connector is destroyed */
	disconnect(): Promise<void> {
		if (this._unsubscribe) {
			this._unsubscribe();
			this._unsubscribe = null;
		}
		return Promise.resolve();
	}

	/** Unique connector id. */
	get id(): string {
		return "Nethermind Devnet";
	}

	/** Connector name. */
	get name(): string {
		return "Nethermind Devnet";
	}

	/** Connector icons. */
	get icon(): string {
		return "https://cdn.prod.website-files.com/63bcd69729ab7f3ec1ad210a/673332c99b5216ff4b13e897_Nethermind_32px.png";
	}

	/** Whether connector is available for use */
	available(): boolean {
		return true;
	}

	/** Whether connector is already authorized */
	async ready(): Promise<boolean> {
		return true;
	}

	/** Connect wallet. */
	async connect(): Promise<ConnectorData> {
		return {
			account: this._account?.address,
			chainId: BigInt(nethermindDevnet.id),
		};
	}

	async account(): Promise<AccountInterface> {
		if (!this._account) {
			throw new Error("Account not connected");
		}
		return this._account;
	}

	/** Get current chain id. */
	async chainId(): Promise<bigint> {
		return BigInt(nethermindDevnet.id);
	}

	/** Create request call to wallet */
	async request<T extends RpcMessage["type"]>(call: RequestFnCall<T>): Promise<RpcTypeToMessageMap[T]["result"]> {
		const { type, params } = call;

		switch (type) {
			case "wallet_requestChainId":
				return this._chainId.toString();
			case "wallet_getPermissions":
				return [Permission.ACCOUNTS];
			case "wallet_requestAccounts":
				return this._account ? [this._account.address] : [];
			case "wallet_addStarknetChain":
				return true;
			case "wallet_watchAsset":
				return true;
			case "wallet_switchStarknetChain": {
				return true;
			}
			case "wallet_addDeclareTransaction": {
				if (!params) throw new Error("Params are missing");
				if (!this._account) throw new Error("Account not connected");

				const { compiled_class_hash, contract_class, class_hash } =
				params as AddDeclareTransactionParameters;

				return await this._account.declare({
					compiledClassHash: compiled_class_hash,
					// @ts-expect-error - contract class is guaranteed to be valid
					contract: contract_class,
					classHash: class_hash,
				});
			}
			case "wallet_addInvokeTransaction": {
				if (!params) throw new Error("Params are missing");
				if (!this._account) throw new Error("Account not connected");

				const { calls } = params as AddInvokeTransactionParameters;

				return await this._account.execute(transformCalls(calls));
			}
			case "wallet_signTypedData": {
				if (!params) throw new Error("Params are missing");

				if (!this._account) throw new Error("Account not connected");
				const { domain, message, primaryType, types } = params as TypedData;

				return (await this._account.signMessage({
					domain,
					message,
					primaryType,
					types,
				})) as string[];
			}
			default:
				throw new Error("Unknown request type");
		}
	}
}

// Factory function to create the connector
export const createDevnetConnector = (): NethermindDevnetConnector => {
	return new NethermindDevnetConnector();
};

// Hook to update the store when atom changes
export const useDevnetAccountUpdate = () => {
	const account = useAtomValue(devnetAccountAtom);
	const store = DevnetAccountStore.getInstance();

	React.useEffect(() => {
		store.updateAccount(account);
	}, [account]);
};

function transformCalls(calls: RequestCall[]) {
	return calls.map(
		(call) =>
			({
				contractAddress: call.contract_address,
				entrypoint: call.entry_point,
				calldata: call.calldata,
			}) as Call,
	);
}