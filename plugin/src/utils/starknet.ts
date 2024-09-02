import { BigNumber } from 'ethers'

import { type ParameterMetadata, ParameterType } from './types/contracts'

enum StarknetChainId {
  SN_MAIN = '0x534e5f4d41494e',
  SN_GOERLI = '0x534e5f474f45524c49',
  SN_SEPOLIA = '0x534e5f5345504f4c4941'
}

export function getChainName (chainId: string): string {
  chainId = BigNumber.from(chainId).toHexString()
  switch (chainId) {
    case StarknetChainId.SN_MAIN:
      return 'mainnet'
    case StarknetChainId.SN_GOERLI:
      return 'goerli'
    case StarknetChainId.SN_SEPOLIA:
      return 'sepolia'
    default:
      return 'unknown'
  }
}

export function normalizeParam (
  param: any | any[],
  metadata: ParameterMetadata
): string[] {
  if (metadata.type === ParameterType.Uint256) {
    const helperValue = BigNumber.from(BigInt(1) << BigInt(128))
    const value = BigNumber.from(param)
    const low = value.mod(helperValue)
    const high = value.div(helperValue)
    return [low, high].map(parse)
  }
  if (metadata.type === ParameterType.Complex) {
    // The operation below is due to the fact that calldata consisting of struct arrays (or only arrays)
    // at the beginning must contain the length of the array.
    // PropertyLength is is the number of parameters included in the structure.
    // TODO: check this.
    const propertyLength = metadata.names != null ? metadata.names.length : 1
    const paramLength = param.length / propertyLength
    return [paramLength, ...param].map(parse)
  }
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (param.toString().includes(',') || Array.isArray(param)) {
    if (!Array.isArray(param)) {
      param = param.split(/(?:,| )+/)
    }
    return [param.length, ...param].map(parse)
  }
  return [param].map(parse)
}

function parse (value: any): string {
  if (typeof value === 'string') return value
  return BigNumber.from(value).toString()
}

export const correctWalletAddress = (address: string | undefined): string => {
  if (address === undefined) return ''
  if (!address.startsWith('0x')) {
    throw new Error('Invalid address format')
  }

  const hexPart = address.slice(2)
  if (hexPart.length === 64) {
    return address
  }

  const paddedHexPart = hexPart.padStart(64, '0')
  return '0x' + paddedHexPart
}
