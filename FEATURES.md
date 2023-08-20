# Starknet Remix plugin

## Feature list

| Id | Category | Feature | Status | Description |
|----|----------|---------|--------|-------------|
|1.1 | General | Create Cairo File | Ready | Remix built in function - "Create new file", make sure the file extension is .cairo |
|1.2 | General | Create Cairo Workspace | Proposed | in Remix -> Workspaces -> Create, have 'Starknet - Cairo' template to choose from available templates |
|1.3 | General | Highlight Cairo syntax | Ready | In Cairo file editor - highlight Cairo language syntax |
|1.4 | General | Highlight Cairo compilation errors/warnings | Ready | In Cairo file editor - highlight compiler errors/warnings as returned from backend compilation run |
|1.5 | General | Select Cairo compiler version to use | Ready | In Starknet plugin header, click on the "Using [compiler version]" label to select from available compiler versions |
|2.1 | Compile | Compile single Cairo source file | Ready | When a single .cairo file is selected in File explorer, "Compile [filename]" button can be pressed, which launches file compilation |
|2.2 | Compile | Compile whole Cairo workspace (with Scarb) | Proposed | When in a Cairo workspace, "Compile workspace" button can be pressed, which launches Scarb build of the whole workspace (design needed??? what impact on Deploy features?) |
|3.1 | Deploy | Deploy contract to network | Ready | Select a contract from a list of successfully compiled contracts, fill in respective fields (contract constructor arguments), press "Deploy [filename]" button to deploy the compiled contract's bytecode to selected "Environment" |
|3.2 | Deploy | Link to Interact with deployed contract | Ready | Select a successfully deployed contract - a link to `Interact` section appears at the bottom of `Deploy` section |
|4.1 | Interact | Call/invoke contract method | Ready | Select a successfully deployed contract - choose a read or write method of the contract, supply call parameters and launch a method call/invocation |\
|5.1 | Transactions | View transaction list in UI | Ready | View list of transactions related to available contracts - in plugin UI |
|5.2 | Transactions | View transactions in Voyager? | Ready | (For contracts deployed to Starknet testnets/mainnet) Click a Voyager/Starkscan icon next to Transactions section label to select Voyager, then click the transaction hash link to open Voyager view for that transaction |
|5.3 | Transactions | View transactions in Starkscan? | Ready | (For contracts deployed to Starknet testnets/mainnet) Click a Voyager/Starkscan icon next to Transactions section label to select Starkscan, then click the transaction hash link to open Starkscan view for that transaction |
|6.1 | Environment  | Select Remote Devnet | Ready | Select Remote Devnet Environment and pick one from existing Remote Devnet accounts |
|6.2 | Environment  | Select Local Devnet | Ready | Select Local Devnet Environment and pick one from existing Local Devnet accounts |
|6.3 | Environment  | Select Braavos Wallet | Ready | Select Wallet Selection and choose Braavos to connect to a selected account in your Braavos plugin |
|6.4 | Environment  | Select Argent X Wallet | Ready | Select Wallet Selection and choose Argent X to connect to a selected account in your Argent X plugin |
|6.5 | Environment | View selected account in Voyager | Ready | Click a Voyager/Starkscan icon next to Wallet account label to select Voyager, then click the account number link to open Voyager view for that account |
|6.6 | Environment | View selected account in Starkscan | Ready | Click a Voyager/Starkscan icon next to Wallet account label to select Voyager, then click the account number link to open Voyager view for that account |
|6.7 | Environment | Create a new Starkscan account | Ready | Click Environment -> Test Accounts to enter Test Account maintenance. Press '+' button to create a new account id, select the target Starkscan network, then click "Deploy Account" |
|6.8 | Environment | Request funds on Starknet Faucet | Ready | Click Environment -> Test Accounts to enter Test Account maintenance. Press 'Request funds...' button to open a Starknet Faucet page in a new browser tab |


