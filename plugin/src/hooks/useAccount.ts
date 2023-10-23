import type React from 'react'
import { useState } from 'react'
import { type Account, type AccountInterface } from 'starknet'

const useAccount = (): {
  account: Account | AccountInterface | null
  setAccount: React.Dispatch<React.SetStateAction<Account | AccountInterface | null>>
} => {
  const [account, setAccount] = useState<Account | AccountInterface | null>(
    null
  )

  return { account, setAccount }
}

export default useAccount
