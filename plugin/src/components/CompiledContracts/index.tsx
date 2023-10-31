import React, { CSSProperties } from 'react'
import {
  getContractNameFromFullName,
  getSelectedContractIndex,
  getShortenedHash
} from '../../utils/utils'
import { useAtom } from 'jotai'
import { compiledContractsAtom, selectedCompiledContract } from '../../atoms/compiledContracts'
interface CompiledContractsProps {
  show: 'class' | 'contract'
}

const CompiledContracts: React.FC<CompiledContractsProps> = (props) => {
  const [contracts] = useAtom(compiledContractsAtom)
  const [selectedContract, setSelectedContract] = useAtom(selectedCompiledContract)

  const handleCompiledContractSelectionChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    event.preventDefault()
    if (!isNaN(parseInt(event?.target?.value))) { setSelectedContract(contracts[event.target.value as unknown as number]) }
  }

  return (
    <select
      className="custom-select"
      aria-label=".form-select-sm example"
      onChange={(e) => {
        handleCompiledContractSelectionChange(e)
      }}
      defaultValue={getSelectedContractIndex(contracts, selectedContract)}
      style={{backgroundColor: 'var(--background)', color: 'var(--text)'}}
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
