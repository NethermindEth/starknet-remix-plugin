import { type BigNumberish } from "ethers";
import { type AccountInterface, type CairoAssembly, type constants, type InvokeFunctionResponse } from "starknet";

interface DeployedInfo {
	address: string;
	chainId: constants.StarknetChainId;
}

interface DeclaredInfo {
	chainId: constants.StarknetChainId;
	env: string;
}

interface Contract {
	name: string;
	compiledClassHash: string;
	classHash: string;
	sierraClassHash: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	sierra: any;
	casm: CairoAssembly;
	abi: Abi;
	deployedInfo: DeployedInfo[];
	declaredInfo: DeclaredInfo[];
	address: string;
}

interface Input {
	name: string;
	type: string;
}

type Output = Input;

type CallDataObj = BigNumberish[] | CallDataObj[];

interface AbiElement {
	type: string;
	name: string;
	inputs: Input[];
	outputs?: Output[];
	state_mutability?: string;
	calldata?: CallDataObj[];
	items?: AbiElement[];
	callFunction?: (account: AccountInterface) => Promise<InvokeFunctionResponse>;
}

type Abi = AbiElement[];

type CallDataObject = Record<
string,
{
	name: string;
	value: string;
	type: string | undefined;
}
>;

export type {
	Abi,
	AbiElement,
	CallDataObject,
	Contract,
	Input,
	Output,
	CallDataObj,
	DeployedInfo,
	DeclaredInfo
};
