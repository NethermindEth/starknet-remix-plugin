import { type BigNumberish } from "ethers";
import { type AccountInterface, type CairoAssembly, type constants, type InvokeFunctionResponse } from "starknet";

interface Contract {
	name: string;
	compiledClassHash: string;
	classHash: string;
	sierraClassHash: string;
	sierra: any;
	casm: CairoAssembly;
	abi: Abi;
	path: string;
	deployedInfo: Array<{
		address: string;
		chainId: constants.StarknetChainId;
	}>;
	declaredInfo: Array<{
		chainId: constants.StarknetChainId;
		env: string;
	}>;
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

type Contracts = Record<string, Contract>;

type CallDataObject = Record<
string,
{
	name: string;
	value: string;
	type: string | undefined;
}
>;

interface ContractFile {
	file_name: string;
	real_path: string;
	file_content: string;
}

interface CompilationRequest {
	files: ContractFile[];
}

interface CompilationResult {
	status: string;
	message: string;
	artifacts: ContractFile[];
}

export type {
	Abi,
	AbiElement,
	CallDataObject,
	Contract,
	Contracts,
	Input,
	Output,
	ContractFile,
	CompilationRequest,
	CompilationResult,
	CallDataObj
};
