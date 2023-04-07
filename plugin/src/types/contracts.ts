import { SierraContractClass } from "starknet";

interface Contract {
  name: string;
  classHash: string;
  sierra: SierraContractClass;
  abi: Abi;
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

export type {
  Contract,
  Input,
  Output,
  AbiElement,
  Abi,
  Contracts,
  CallDataObject,
};
