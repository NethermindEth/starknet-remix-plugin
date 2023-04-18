import { CairoAssembly, SierraContractClass } from "starknet";

interface Contract {
  name: string;
  classHash: string;
  sierra: SierraContractClass;
  casm: CairoAssembly;
  abi: Abi;
  path: string;
  deployed: boolean;
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
  Contract,
  Input,
  Output,
  AbiElement,
  Abi,
  Contracts,
  CallDataObject,
  ParameterMetadata,
  FunctionReturnType,
};

export { ParameterType };
