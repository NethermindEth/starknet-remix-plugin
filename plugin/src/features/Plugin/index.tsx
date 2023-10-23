import React, { useState } from 'react'

import { Environment } from '../Environment'
import './styles.css'

import Compilation from '../Compilation'
import Deployment from '../Deployment'
import Interaction from '../Interaction'
import Accordian, {
  AccordianItem,
  AccordionContent,
  AccordionTrigger
} from '../../components/ui_components/Accordian'
import TransactionHistory from '../TransactionHistory'
import CairoVersion from '../CairoVersion'
import StateAction from '../../components/StateAction'
import BackgroundNotices from '../../components/BackgroundNotices'
import ExplorerSelector, {
  useCurrentExplorer
} from '../../components/ExplorerSelector'
import { useAtomValue } from 'jotai'
import { isCompilingAtom } from '../../atoms/compilation'
import { deploymentAtom } from '../../atoms/deployment'
export type AccordianTabs =
  | 'compile'
  | 'deploy'
  | 'interaction'
  | 'transactions'
  | ''

const Plugin: React.FC = () => {
  const isCompiling = useAtomValue(isCompilingAtom)

  const {
    isDeploying,
    deployStatus
  } = useAtomValue(deploymentAtom)

  // Interaction state variables
  const [interactionStatus, setInteractionStatus] = useState<'loading' | 'success' | 'error' | ''>('')

  const [currentAccordian, setCurrentAccordian] =
    useState<AccordianTabs>('compile')

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  const handleTabView = (clicked: AccordianTabs) => {
    if (currentAccordian === clicked) {
      setCurrentAccordian('')
    } else {
      setCurrentAccordian(clicked)
    }
  }

  const explorerHook = useCurrentExplorer()

  return (
    <>
      <div className="plugin-wrapper">
        <div className="plugin-main-wrapper">
          <CairoVersion />
          <Accordian
            type="single"
            value={currentAccordian}
            defaultValue={'compile'}
          >

            <AccordianItem value="compile">
              <AccordionTrigger
                onClick={() => {
                  handleTabView('compile')
                }}
              >
                <span
                  className="d-flex align-items-center"
                  style={{ gap: '0.5rem' }}
                >
                  <p style={{ all: 'unset' }}>Compile</p>
                  <StateAction
                    value={
                      isCompiling
                        ? 'loading'
                        : status === 'done'
                          ? 'success'
                          : status === 'failed' ? 'error' : ''
                    }
                  />
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <Compilation setAccordian={setCurrentAccordian} />
              </AccordionContent>
            </AccordianItem>

            <AccordianItem value="deploy">
              <AccordionTrigger
                onClick={() => {
                  handleTabView('deploy')
                }}
              >
                <span
                  className="d-flex align-items-center"
                  style={{ gap: '0.5rem' }}
                >
                  <p style={{ all: 'unset' }}>Deploy</p>
                  <StateAction
                    value={
                      isDeploying
                        ? 'loading'
                        : deployStatus === 'error'
                          ? 'error'
                          : deployStatus === 'done'
                            ? 'success'
                            : ''
                    }
                  />
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <Deployment setActiveTab={setCurrentAccordian} />
              </AccordionContent>
            </AccordianItem>
            <AccordianItem value="interaction">
              <AccordionTrigger
                onClick={() => {
                  handleTabView('interaction')
                }}
              >
                <span
                  className="d-flex align-items-center"
                  style={{ gap: '0.5rem' }}
                >
                  <p style={{ all: 'unset' }}>Interact</p>
                  <StateAction
                    value={interactionStatus}
                  />
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <Interaction setInteractionStatus={setInteractionStatus} />
              </AccordionContent>
            </AccordianItem>
            <AccordianItem value="transactions">
              <AccordionTrigger
                onClick={() => {
                  handleTabView('transactions')
                }}
              >
                <span
                  className="d-flex align-items-center"
                  style={{ gap: '0.5rem' }}
                >
                  <p style={{ all: 'unset' }}> Transactions</p>
                  <ExplorerSelector
                    path=""
                    isTextVisible={false}
                    controlHook={explorerHook}
                  />
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <TransactionHistory controlHook={explorerHook} />
              </AccordionContent>
            </AccordianItem>
          </Accordian>
          <div className="mt-5">
            <BackgroundNotices />
          </div>
        </div>
        <div>
          <Environment />
        </div>
      </div>
    </>
  )
}

export default Plugin
