import React, { useEffect, useState } from "react";
import { type BigNumberish } from "ethers";
import { constants } from "starknet";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import CompiledContracts from "../../components/CompiledContracts";
import { type Contract } from "../../utils/types/contracts";
import { getConstructor, getShortenedHash } from "../../utils/utils";
import Container from "../../components/ui_components/Container";
import { BsPlus } from "react-icons/bs";

import { type AccordianTabs } from "../Plugin";
import transactionsAtom from "../../atoms/transactions";

import "./styles.css";
import {
	compiledContractsAtom,
	deployedContractsAtom,
	selectedCompiledContract,
	selectedDeployedContract
} from "../../atoms/compiledContracts";
import { envAtom } from "../../atoms/environment";
import useAccount from "../../hooks/useAccount";
import useProvider from "../../hooks/useProvider";
import useRemixClient from "../../hooks/useRemixClient";
import {
	constructorInputsAtom,
	declStatusAtom,
	declTxHashAtom,
	deploymentAtom,
	deployStatusAtom,
	deployTxHashAtom,
	isDelcaringAtom,
	isDeployingAtom
} from "../../atoms/deployment";

import { useTransactionReceipt } from "@starknet-react/core";
import { type CallbackReturnType, ConstructorForm } from "starknet-abi-forms";
import { useIcon } from "../../hooks/useIcons";
import { DeclareStatusLabels } from "../../utils/constants";
import AddContractArtifacts from "../../components/AddContractArtifacts";

interface DeploymentProps {
	setActiveTab: (tab: AccordianTabs) => void;
}

const Deployment: React.FC<DeploymentProps> = ({ setActiveTab }) => {
	const { remixClient } = useRemixClient();
	const { account } = useAccount();
	const { provider } = useProvider();

	const [contracts, setContracts] = useAtom(compiledContractsAtom);
	const [selectedContract, setSelectedContract] = useAtom(selectedCompiledContract);
	const [deployedContracts, setDeployedContracts] = useAtom(deployedContractsAtom);
	const setSelectedDeployedContract = useSetAtom(selectedDeployedContract);
	const [isAddContractOpen, setIsAddContractOpen] = useState(false);

	useEffect(() => {
		if (contracts.length > 0 && (selectedContract === null)) {
			setSelectedContract(contracts[0]);
		}
	}, [contracts]);

	const {
		isDeclaring,
		isDeploying,
		declStatus,
		notEnoughInputs,
		declTxHash,
		deployTxHash
	} =
		useAtomValue(deploymentAtom);

	const setIsDeploying = useSetAtom(isDeployingAtom);
	const setDeployStatus = useSetAtom(deployStatusAtom);
	const setIsDeclaring = useSetAtom(isDelcaringAtom);
	const setDeclStatus = useSetAtom(declStatusAtom);
	const setConstructorInputs = useSetAtom(constructorInputsAtom);

	const setDeclTxHash = useSetAtom(declTxHashAtom);
	const setDeployTxHash = useSetAtom(deployTxHashAtom);

	const [transactions, setTransactions] = useAtom(transactionsAtom);
	const env = useAtomValue(envAtom);

	const declTxStatus = useTransactionReceipt({
		hash: declTxHash,
		watch: true
	});
	const deployTxStatus = useTransactionReceipt({
		hash: deployTxHash,
		watch: true
	});

	const [chainId, setChainId] = useState<constants.StarknetChainId>(
		constants.StarknetChainId.SN_SEPOLIA
	);

	useEffect(() => {
		if (provider !== null) {
			// eslint-disable-next-line @typescript-eslint/no-misused-promises
			setTimeout(async () => {
				try {
					const chainId = await provider.getChainId();
					setChainId(chainId);
				} catch (error) {
					console.log(error);
				}
			}, 1);
		}
	}, [provider]);

	useEffect(() => {
		if (selectedContract != null) {
			setConstructorInputs(getConstructor(selectedContract?.abi)?.inputs ?? []);
		}
	}, [selectedContract]);

	useEffect(() => {
		console.log("declTxHash", declTxHash, declTxStatus.status, env);
		if (declTxHash === "") {
			setIsDeclaring(false);
			setDeclStatus("IDLE");
			return;
		}
		if (env !== "wallet") return;
		if (declTxStatus.status === "success") {
			setDeclStatus("DONE");
			setIsDeclaring(false);
			remixClient.emit("statusChanged", {
				key: "succeed",
				type: "success",
				title: `Contract ${selectedContract?.name ?? ""} declared!`
			});
			remixClient
				.call("terminal", "log", {
					value: JSON.stringify(declTxStatus.data, null, 2),
					type: "info"
				})
				.catch(() => {
				});

			remixClient
				.call("terminal", "log", {
					value: `--------------------- End getting declare contract: ${
						selectedContract?.name ?? ""
					} tx receipt ------------------`,
					type: "info"
				})
				.catch(() => {
				});
		}
		if (declTxStatus.status === "error") {
			setDeclStatus("ERROR");
			remixClient.emit("statusChanged", {
				key: "failed",
				type: "error",
				title: "Declaration failed"
			});
			remixClient
				.call("terminal", "log", {
					value: JSON.stringify(declTxStatus, null, 2),
					type: "info"
				})
				.catch(() => {
				});

			remixClient
				.call("terminal", "log", {
					value: `--------------------- End getting declare contract: ${
						selectedContract?.name ?? ""
					} tx receipt ------------------`,
					type: "info"
				})
				.catch(() => {
				});
			setIsDeclaring(false);
		}
		if (declTxStatus.status === "pending") {
			if (isDeclaring) {
				remixClient
					.call("terminal", "log", {
						value: `--------------------- Getting declare contract: ${
							selectedContract?.name ?? ""
						} tx receipt --------------------`,
						type: "info"
					})
					.catch(() => {
					});
			}
		}
	}, [declTxHash, declTxStatus.status]);

	useEffect(() => {
		console.log("deployTxHash", deployTxHash, deployTxStatus.status, env);
		if (deployTxHash === "") {
			setIsDeploying(false);
			setDeployStatus("IDLE");
			return;
		}
		// todo: why?
		// if (env !== "wallet") return;
		if (deployTxStatus.status === "success") {
			setDeployStatus("DONE");
			setIsDeploying(false);
			remixClient.emit("statusChanged", {
				key: "succeed",
				type: "success",
				title: `Contract ${selectedContract?.name ?? ""} deployed!`
			});
			remixClient
				.call("terminal", "log", {
					value: JSON.stringify(deployTxStatus.data, null, 2),
					type: "info"
				})
				.catch(() => {
				});

			remixClient
				.call("terminal", "log", {
					value: `--------------------- End getting deploy contract: ${
						selectedContract?.name ?? ""
					} tx receipt ------------------`,
					type: "info"
				})
				.catch(() => {
				});
		}
		if (deployTxStatus.status === "error") {
			setDeployStatus("ERROR");
			remixClient.emit("statusChanged", {
				key: "failed",
				type: "error",
				title: "Deployment failed"
			});
			remixClient
				.call("terminal", "log", {
					value: JSON.stringify(deployTxStatus, null, 2),
					type: "info"
				})
				.catch(() => {
				});

			remixClient
				.call("terminal", "log", {
					value: `--------------------- End getting deploy contract: ${
						selectedContract?.name ?? ""
					} tx receipt ------------------`,
					type: "info"
				})
				.catch(() => {
				});
			setIsDeploying(false);
		}
		if (deployTxStatus.status === "pending") {
			if (isDeploying) {
				remixClient
					.call("terminal", "log", {
						value: `--------------------- Getting deploy contract: ${
							selectedContract?.name ?? ""
						} tx receipt --------------------`,
						type: "info"
					})
					.catch(() => {
					});
			}
		}
	}, [deployTxHash, deployTxStatus.status]);

	const declareContract = async (): Promise<void> => {
		setDeclStatus("IDLE");
		setIsDeclaring(true);
		let updatedTransactions = transactions;
		try {
			if (account === null || provider === null) {
				throw new Error("No account or provider selected!");
			}

			if (selectedContract === null) {
				throw new Error("No contract selected for deployment!");
			}
			remixClient.emit("statusChanged", {
				key: "loading",
				type: "info",
				title: `Declaring ${selectedContract?.name ?? ""} ...`
			});
			setDeclStatus("IN_PROGRESS");
			try {
				try {
					await account.getClassByHash(selectedContract.classHash);
					await remixClient.call(
						"notification" as any,
						"toast",
						`ℹ️ Contract with classHash: ${getShortenedHash(
							selectedContract.classHash,
							6,
							4
						)} already has been declared, you can proceed to deployment`
					);
					setIsDeclaring(false);
					setDeclStatus("DONE");
					remixClient.emit("statusChanged", {
						key: "succeed",
						type: "success",
						title: `Contract ${selectedContract?.name ?? ""} declared!`
					});
				} catch (error) {
					await remixClient.call("terminal", "log", {
						value: `------------------------ Declaring contract: ${selectedContract.name} ------------------------`,
						type: "info"
					});
					const declareResponse = await account.declare(
						{
							contract: selectedContract.sierra,
							classHash: selectedContract.classHash,
							compiledClassHash: selectedContract.compiledClassHash
						},
						{ maxFee: 1e18 }
					);
					await remixClient.call("terminal", "log", {
						value: JSON.stringify(declareResponse, null, 2),
						type: "info"
					});
					await remixClient.call("terminal", "log", {
						value: `---------------------- End Declaring contract: ${selectedContract.name} ----------------------`,
						type: "info"
					});
					updatedTransactions = [
						{
							type: "declare",
							account,
							provider,
							txId: declareResponse.transaction_hash,
							env
						},
						...updatedTransactions
					];
					setTransactions(updatedTransactions);
					if (env === "wallet") {
						setDeclTxHash(declareResponse.transaction_hash);
					} else {
						await remixClient.call("terminal", "log", {
							value: `--------------------- Getting declare contract: ${selectedContract.name} tx receipt --------------------`,
							type: "info"
						});
						const txReceipt = await account.waitForTransaction(
							declareResponse.transaction_hash
						);
						await remixClient.call("terminal", "log", {
							value: JSON.stringify(txReceipt, null, 2),
							type: "info"
						});
						await remixClient.call("terminal", "log", {
							value: `--------------------- End getting declare contract: ${selectedContract.name} tx receipt ------------------`,
							type: "info"
						});
						setDeclStatus("DONE");
						setIsDeclaring(false);
					}
				}
				setContractDeclaration(selectedContract);
			} catch (error) {
				setDeclStatus("ERROR");
				setIsDeclaring(false);
				if (error instanceof Error) {
					await remixClient.call("terminal", "log", {
						value: error.message,
						type: "error"
					});
					throw new Error(
						error.message +
						"\n Aborting deployment... Couldn't get declare infomation" +
						"\n Please ensure that the Account is deployed on the chain"
					);
				}
			}
		} catch (error) {
			setDeclStatus("ERROR");
			setIsDeclaring(false);
			if (error instanceof Error) {
				await remixClient.call("terminal", "log", {
					value: error.message,
					type: "error"
				});
			}
			remixClient.emit("statusChanged", {
				key: "failed",
				type: "error",
				title: "Declaration failed, error logged in the terminal!"
			});
		}
	};

	const deploy = async (calldata: BigNumberish[]): Promise<void> => {
		setDeployStatus("IDLE");
		setIsDeploying(true);
		const classHash = selectedContract?.classHash;
		const updatedTransactions = transactions;
		try {
			if (account === null || provider === null) {
				throw new Error("No account or provider selected!");
			}

			if (selectedContract === null) {
				throw new Error("No contract selected for deployment!");
			}
			remixClient.emit("statusChanged", {
				key: "loading",
				type: "info",
				title: `Deploying ${selectedContract?.name ?? ""} ...`
			});

			setDeployStatus("IN_PROGRESS");
			await remixClient.call("terminal", "log", {
				value: `------------------------ Deploying contract: ${selectedContract.name} ------------------------`,
				type: "info"
			});

			console.log("account: ", account, "provider: ", provider, "selectedContract: ", selectedContract, "classHash: ", classHash, "calldata: ", calldata);

			const deployResponse = await account.deployContract(
				{
					classHash: classHash ?? selectedContract.classHash,
					constructorCalldata: calldata
				},
				{ maxFee: 1e18 }
			);

			console.log("deployResponse: ", deployResponse);

			await remixClient.call("terminal", "log", {
				value: JSON.stringify(deployResponse, null, 2),
				type: "info"
			});

			await remixClient.call("terminal", "log", {
				value: `---------------------- End Deploying contract: ${selectedContract.name} ----------------------`,
				type: "info"
			});

			setTransactions([
				{
					type: "deploy",
					account,
					provider,
					txId: deployResponse.transaction_hash,
					env
				},
				...updatedTransactions
			]);
			if (env === "wallet") {
				setDeployTxHash(deployResponse.transaction_hash);
			} else {
				setDeployStatus("DONE");
				setIsDeploying(false);
				await remixClient.call("terminal", "log", {
					value: `--------------------- Getting deploy contract: ${selectedContract.name} tx receipt --------------------`,
					type: "info"
				});

				const txReceipt = await account.waitForTransaction(deployResponse.transaction_hash);
				await remixClient.call("terminal", "log", {
					value: JSON.stringify(txReceipt, null, 2),
					type: "info"
				});

				await remixClient.call("terminal", "log", {
					value: `--------------------- End getting deploy contract: ${selectedContract.name} tx receipt ------------------`,
					type: "info"
				});
				setActiveTab("interaction");
			}
			setContractDeployment(selectedContract, deployResponse.contract_address[0]);
		} catch (error) {
			setDeployStatus("ERROR");
			setIsDeploying(false);
			if (error instanceof Error) {
				await remixClient.call("terminal", "log", {
					value: error.message,
					type: "error"
				});
			}
			remixClient.emit("statusChanged", {
				key: "failed",
				type: "error",
				title: "Deployment failed, error logged in the terminal!"
			});
		}
	};

	const handleDeploy = (calldata: BigNumberish[]): void => {
		deploy(calldata).catch((error) => {
			console.log("Error during deployment:", error);
		});
	};

	const handleDeclare = (event: any): void => {
		event.preventDefault();
		declareContract().catch((error) => {
			console.log("Error during declaration:", error);
		});
	};

	const handleDeploySubmit = (data: CallbackReturnType): void => {
		handleDeploy(data?.starknetjs ?? (data.raw as BigNumberish[]));
	};

	const setContractDeclaration = (currentContract: Contract): void => {
		if (account == null) return;
		const declaredContract = {
			...currentContract,
			declaredInfo: [...currentContract.declaredInfo, {
				chainId,
				env
			}]
		};
		const updatedContracts = contracts.map((contract) => {
			if (contract.classHash === declaredContract.classHash) {
				return declaredContract;
			}
			return contract;
		});
		setContracts(updatedContracts);
		setSelectedContract(declaredContract);
	};

	const setContractDeployment = (currentContract: Contract, address: string): void => {
		if (account == null) return;

		// Update the contract with new deployment info
		const deployedInfoMap = new Map<string, boolean>();
		const deployedContract = {
			...currentContract,
			address,
			deployedInfo: [
				...currentContract.deployedInfo,
				{
					address: account.address,
					chainId
				}
			].flatMap((deployment) => {
				const key = `${deployment.address}-${deployment.chainId}`;
				if (deployedInfoMap.has(key)) {
					return [];
				} else {
					deployedInfoMap.set(key, true);
					return [deployment];
				}
			})
		};

		// Update compiled contracts list
		const updatedContracts = contracts.map((contract) => {
			if (contract.classHash === deployedContract.classHash) {
				return deployedContract;
			}
			return contract;
		});
		setContracts(updatedContracts);
		setSelectedContract(deployedContract);

		// Add new deployed contract
		setDeployedContracts([deployedContract, ...deployedContracts]);

		// Set as selected deployed contract for interaction
		setSelectedDeployedContract(deployedContract);
	};

	return (
		<>
			<Container>
				<div className="">
					<div className="compilation-info flex-col text-center align-items-center mb-2">
						<div className="icon">
							<img src={useIcon("deploy-icon.svg")} alt="deploy-icon" />
						</div>
						<div className="deployment-header">
							<span className="mt-1 mb-1 text-no-break">
								{contracts.length > 0 && selectedContract !== null
									? "Deploy your selected contract"
									: "No contracts ready for deployment yet, compile a cairo contract"}
							</span>
							<button
								className="add-contract-button"
								onClick={(): void => {
									setIsAddContractOpen(true);
								}}
							>
								<BsPlus size={24} />
							</button>
						</div>
					</div>
					<CompiledContracts show={"class"} />

					{contracts.length > 0 && selectedContract !== null
						? (
							<div>
								<button
									className="btn btn-primary text-white btn-block d-block w-100 text-break remixui_disabled mb-1 mt-3 px-0 rounded"
									style={{
										cursor: `${
											isDeclaring ||
											account == null ||
											selectedContract.declaredInfo.some(
												(info) => info.chainId === chainId && info.env === env
											)
												? "not-allowed"
												: "pointer"
										}`
									}}
									disabled={
										isDeclaring ||
										account == null ||
										selectedContract.declaredInfo.some(
											(info) => info.chainId === chainId && info.env === env
										)
									}
									aria-disabled={
										isDeclaring ||
										account == null ||
										selectedContract.declaredInfo.some(
											(info) => info.chainId === chainId && info.env === env
										)
									}
									onClick={handleDeclare}
								>
									<div className="d-flex align-items-center justify-content-center">
										<div className="text-truncate overflow-hidden text-nowrap">
											{isDeclaring
												? (
													<>
														<span
															style={{
																paddingLeft: "0.5rem"
															}}
														>
															{DeclareStatusLabels[declStatus]}
														</span>
													</>
												)
												: (
													<div className="p-1 text-truncate overflow-hidden text-nowrap">
														{account !== null &&
														selectedContract.declaredInfo.some(
															(info) =>
																info.chainId === chainId &&
																info.env === env
														)
															? (
																<span>
																	{" "}
																	Declared {selectedContract.name}{" "}
																	<i className="bi bi-check"></i>
																</span>
															)
															: (
																<span> Declare {selectedContract.name}</span>
															)}
													</div>
												)}
										</div>
									</div>
								</button>
								<ConstructorForm
									abi={selectedContract.abi}
									callBackFn={handleDeploySubmit}
								/>
								{account != null &&
									selectedContract.deployedInfo.some(
										(info) =>
											info.address === account.address &&
											info.chainId === chainId
									) && (
									<div className="mt-3">
										<label style={{ display: "block" }}>
											Contract deployed! See{" "}
											<a
												href="/"
												className="text-info"
												onClick={(e) => {
													e.preventDefault();
													setActiveTab("interaction");
												}}
											>
												Interact
											</a>{" "}
											for more!
										</label>
									</div>
								)}
								{notEnoughInputs && (
									<label>Please fill out all constructor fields!</label>
								)}
							</div>
						)
						: (
							<></>
						)}
				</div>
			</Container>
			<AddContractArtifacts
				isOpen={isAddContractOpen}
				onOpenChange={setIsAddContractOpen}
			/>
		</>
	);
};

export default Deployment;
