import { BigNumber, BigNumberish } from "ethers";

import { ParameterMetadata, ParameterType } from "../types/contracts";

export enum StarknetChainId {
  SN_MAIN = "0x534e5f4d41494e",
  SN_GOERLI = "0x534e5f474f45524c49",
  SN_GOERLI2 = "0x534e5f474f45524c4932",
}

export function normalizeParam(
  param: any | any[],
  metadata: ParameterMetadata
) {
  if (metadata.type === ParameterType.Uint256) {
    const helperValue = BigNumber.from(BigInt(1) << BigInt(128));
    const value = BigNumber.from(param);
    const low = value.mod(helperValue);
    const high = value.div(helperValue);
    return [low, high].map(parse);
  }
  if (metadata.type === ParameterType.Complex) {
    // The operation below is due to the fact that calldata consisting of struct arrays (or only arrays)
    // at the beginning must contain the length of the array.
    // PropertyLength is is the number of parameters included in the structure.
    // TODO: check this.
    const propertyLength = metadata.names ? metadata.names.length : 1;
    const paramLength = param.length / propertyLength;
    return [paramLength, ...param].map(parse);
  }
  if (param.toString().includes(",") || Array.isArray(param)) {
    if (!Array.isArray(param)) {
      param = param.split(/(?:,| )+/);
    }
    return [param.length, ...param].map(parse);
  }
  return [param].map(parse);
}

function parse(value: any): string {
  if (typeof value === "string") return value;
  return BigNumber.from(value).toString();
}
