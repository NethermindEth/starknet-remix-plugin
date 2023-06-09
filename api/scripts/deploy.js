
  // Right click on the script name and hit "Run" to execute
  (async () => {
      try {
          console.log('deploy to starknet...')
          const compiledCairoContract = await remix.call('fileManager', 'readFile', 'compiled_cairo_artifacts/contract.json');
          const compiledContract = starknet.json.parse(compiledCairoContract);
          const NetworkBaseUrls = {
            'goerli-alpha': 'https://alpha4.starknet.io',
            'mainnet-alpha': 'https://alpha-mainnet.starknet.io'
          }

          const payload = {
            compiledContract: compiledContract,
            transactionInputs: [], // if you have constructor args please add your args
            network: 'goerli-alpha' // mainnet-alpha or goerli-alpha or devnet
          };

          const baseUrl = payload['network'] ? NetworkBaseUrls[payload['network']] : payload['baseUrl'];

          const response = await fetch(baseUrl + '/gateway/add_transaction', {
              method: 'POST',
              headers: {
                accept: 'application/json',
              },
              body: JSON.stringify({
                type: 'DEPLOY',
                contract_address_salt: '0x01319c1c1f0400688eafde419346d0b9876cd3d6a4daaa9f4768a3f5a810c543',
                contract_definition: payload.compiledContract.contract_definition,
                constructor_calldata: payload.transactionInputs
              })
            });

          const responseData = await response.json();

          //  const methodResponse = await callContract({
          //    contract_address: responseData.address,
          //    entry_point_selector: getSelectorFromName("YOUR_FUNCTION_NAME"),
          //    calldata: ["1"],
          //  });
  
          // const result = methodResponse.result[0];
          // result contains the return value of the method you gave to callContract
          if(response.status === 200) {
            console.log('Deployed contract address: ', responseData.address)
            console.log('Deployed contract transaction hash: ', responseData.transaction_hash)
            console.log('Deployment successful.')
          } else {
            console.log('Deployed contract error: ', responseData)
            console.log('Deployment failed.')
          }
          
      } catch (exception) {
          console.log(exception.message)
      }
  })()
  