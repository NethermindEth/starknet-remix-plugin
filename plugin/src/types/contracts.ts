import { BigNumberish } from "ethers";
import { Account, CairoAssembly, InvokeFunctionResponse } from "starknet";

interface Contract {
  name: string;
  classHash: string;
  sierra: any; // CompiledSierra
  casm: CairoAssembly;
  abi: Abi;
  path: string;
  deployed: boolean;
  address: string;
}

interface Input {
  name: string;
  type: string;
}

type Output = Input;

interface AbiElement {
  type: string;
  name: string;
  inputs: Input[];
  outputs?: Output[];
  state_mutability?: string;
  calldata?: BigNumberish[];
  calldataLength?: number;
  calldataIndices?: number[];
  callFunction?: (account: Account) => Promise<InvokeFunctionResponse>;
}

type Abi = AbiElement[];

interface Contracts {
  [classHash: string]: Contract;
}

interface CallDataObject {
  [index: string]: {
    name: string;
    value: string;
    type: string | undefined;
  };
}

// TODO: felt252
enum ParameterType {
  FieldElement = "felt",
  VarFelt = "felt*",
  String = "string",
  Complex = "complex",
  Uint256 = "Uint256",
}

interface ParameterMetadata {
  name: string;
  type: `${ParameterType}`;
  names?: string[];
  structName?: string;
  propertyCount?: number;
}

interface FunctionReturnType {
  [key: string]: string | number | string[] | FunctionReturnType[];
}

export type {
  Abi,
  AbiElement,
  CallDataObject,
  Contract,
  Contracts,
  FunctionReturnType,
  Input,
  Output,
  ParameterMetadata,
};

export { ParameterType };
