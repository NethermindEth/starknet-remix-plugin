import React, { useState } from 'react'
import {
  getContractNameFromFullName,
  getShortenedHash
} from '../../utils/utils'
import { useAtom } from 'jotai'
import { compiledContractsAtom, selectedCompiledContract } from '../../atoms/compiledContracts'
import * as Select from '../../components/ui_components/Select'
import { ChevronDownIcon, TrashIcon } from 'lucide-react'

interface CompiledContractsProps {
  show: 'class' | 'contract'
}

const CompiledContracts: React.FC<CompiledContractsProps> = (props): JSX.Element => {
  const [contracts, setContracts] = useAtom(compiledContractsAtom)
  const [selectedContract, setSelectedContract] = useAtom(selectedCompiledContract)

  const [selectedContractIdx, setSelectedContractIdx] = useState('0')

  const handleCompiledContractSelectionChange = (value: string): void => {
    console.log('handleCompiledContractSelectionChange', value)
    setSelectedContract(contracts[parseInt(value)])
    setSelectedContractIdx(value)
  }

  const handleDeleteContract = (event: React.MouseEvent<HTMLButtonElement>, index: number): void => {
    event.stopPropagation()
    setContracts((prevContracts) => prevContracts.filter((_, i) => i !== index))
  }

  return (
      <Select.Root value={selectedContractIdx} onValueChange={(value) => { handleCompiledContractSelectionChange(value) }}>
        <Select.Trigger className="flex justify-between select-trigger-deployment">
          <Select.Value placeholder={(selectedContract != null)
            ? `${getContractNameFromFullName(selectedContract.name)} (${getShortenedHash(
              selectedContract.classHash ?? '',
              6,
              4
          )})`
            : 'Contract is not selected'}/>
        <Select.Icon>
          <ChevronDownIcon />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content>
          <Select.Viewport>
            {contracts.map((contract, index) => (
              <SelectItemWithDelete
                key={index}
                value={index.toString()}
                onDelete={handleDeleteContract}
                index={index}
                isSelected={selectedContract?.classHash === contract.classHash}
              >
                {`${getContractNameFromFullName(contract.name)} (${getShortenedHash(
                          contract.classHash ?? '',
                          6,
                          4
                      )})`}
              </SelectItemWithDelete>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}

const SelectItemWithDelete = React.forwardRef(
  ({ children, onDelete, index, value, ...props }: any, ref: React.Ref<HTMLDivElement>): JSX.Element => (
    <div className="SelectItemWithDelete">
      <Select.Item {...props} ref={ref} value={value} className="w-full">
        <Select.ItemText>{children}</Select.ItemText>
      </Select.Item>

        <button onClick={(event) => onDelete(event, index)} className={'ml-2 p-1 rounded deleteButton'}>
          <TrashIcon size={16} />
        </button>

    </div>
  )
)

SelectItemWithDelete.displayName = 'SelectItemWithDelete'

export default CompiledContracts
