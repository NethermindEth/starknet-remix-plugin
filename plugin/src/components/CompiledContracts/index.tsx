import React, { useState } from 'react'
import {
  getContractNameFromFullName,
  getShortenedHash
} from '../../utils/utils'
import { useAtom } from 'jotai'
import { compiledContractsAtom, selectedCompiledContract } from '../../atoms/compiledContracts'
import * as Select from '../../components/ui_components/Select'
import { ChevronDownIcon } from 'lucide-react'

interface CompiledContractsProps {
  show: 'class' | 'contract'
}

const CompiledContracts: React.FC<CompiledContractsProps> = (props) => {
  const [contracts] = useAtom(compiledContractsAtom)
  const [selectedContract, setSelectedContract] = useAtom(selectedCompiledContract)

  const [selectedContractIdx, setSelectedContractIdx] = useState('0')

  const handleCompiledContractSelectionChange = (value: string): void => {
    console.log('handleCompiledContractSelectionChange', value)
    setSelectedContract(contracts[value as unknown as number])
    setSelectedContractIdx(value)
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
                  <Select.Item value={index.toString()} key={index}>
                    <Select.ItemText>
                      {`${getContractNameFromFullName(contract.name)} (${getShortenedHash(
                          contract.classHash ?? '',
                          6,
                          4
                      )})`}
                    </Select.ItemText>
                  </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
  )
}

export default CompiledContracts
