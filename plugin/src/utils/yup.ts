import { BigNumber } from 'ethers'
import { uint256 } from 'starknet'
import * as Yup from 'yup'

export const transformInputs = (val: string): BigNumber | BigNumber[] => {
  const isArrayRegex = /[,[\]]/
  const replaceSquareBracesRegex = /[[\]]/g

  if (val.match(isArrayRegex) == null) {
    const num = BigNumber.from(val.trim())
    return num
  } else {
    const newVal = val.replaceAll(replaceSquareBracesRegex, '')
    const newArr = newVal.split(',')
    return newArr.map((str) => BigNumber.from(str.trim()))
  }
}

export const typeValidation = (
  type: string,
  value: BigNumber | BigNumber[]
): boolean => {
  console.log(type, value)
  let isValid = true
  try {
    if (!Array.isArray(value)) {
      if (value.lt(0)) {
        return false
      }
      switch (type) {
        case 'core::integer::u8':
          return Number(value) < 2 ** 8
        case 'core::integer::u16':
          return Number(value) < 2 ** 16
        case 'core::integer::u32':
          return Number(value) < 2 ** 32
        case 'core::integer::u64':
          return Number(value) < 2 ** 64
        case 'core::integer::u128':
          return Number(value) < uint256.UINT_128_MAX
        case 'core::felt252':
          return Number(value) < 2 ** 252
        case 'core::bool':
          return value.lte(1)
        case 'core::integer::u256':
          return false
        default:
          // TODO: @prix0007  add more validations here
          return true
      }
    } else if (Array.isArray(value)) {
      value.forEach((v) => {
        if (v.lt(0)) {
          isValid = false
        }
      })
      switch (type) {
        case 'core::integer::u256':
          // Should be only 2 comma seperated value
          if (value.length !== 2) {
            return false
          }
          value.forEach((v) => {
            if (!(Number(v) < uint256.UINT_128_MAX)) {
              isValid = false
            }
          })
          break
        default:
      }
    }
    return isValid
  } catch (e) {
    console.log(e)
    return false
  }
}

// Add Methods here
Yup.addMethod(Yup.string, 'validate_ip', function (type: string) {
  return this.test('check inputs', type, function (val) {
    const { createError } = this
    if (val !== undefined) {
      try {
        const ip = transformInputs(val)
        const isValid = typeValidation(type, ip)
        if (!isValid) {
          return createError(
            new Yup.ValidationError(`${val} is not correct for type ${type}`)
          )
        }
        return true
      } catch (e: any) {
        return createError(new Yup.ValidationError(e?.message ?? e))
      }
    }
    return createError(new Yup.ValidationError('value is required'))
  })
})

export default Yup
