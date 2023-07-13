// A component that reads the compiled contracts from the context and displays them in a select

import React, { useContext } from 'react'
import { CompiledContractsContext } from '../../contexts/CompiledContractsContext'
import {
  getContractNameFromFullName,
  getSelectedContractIndex,
  getShortenedHash
} from '../../utils/utils'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface CompiledContractsProps {
  show: 'class' | 'contract'
}

const CompiledContracts: React.FC<CompiledContractsProps> = (props) => {
  const { contracts, selectedContract, setSelectedContract } = useContext(
    CompiledContractsContext
  )

  function handleCompiledContractSelectionChange (event: any): void {
    event.preventDefault()
    setSelectedContract(contracts[event.target.value])
  }

  return (
    <select
      className="custom-select"
      aria-label=".form-select-sm example"
      onChange={(e) => {
        handleCompiledContractSelectionChange(e)
      }}
      defaultValue={getSelectedContractIndex(contracts, selectedContract)}
    >
      {contracts.map((contract, index) => {
        return (
          <option value={index} key={index}>
            {`${getContractNameFromFullName(contract.name)} (${getShortenedHash(
              contract.classHash ?? '',
              6,
              4
            )})`}
          </option>
        )
      })}
    </select>
  )
}

export default CompiledContracts
