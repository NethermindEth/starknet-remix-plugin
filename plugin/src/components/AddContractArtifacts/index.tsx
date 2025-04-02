import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useAtom } from "jotai";
import { BsX } from "react-icons/bs";
import { compiledContractsAtom } from "../../atoms/compiledContracts";
import "./styles.css";
import type { Contract, Abi } from "../../utils/types/contracts";
import { fetchClassHashAt, fetchContractClass } from "../../utils/rpc";
import { hash, type CompiledSierra, type CairoAssembly } from "starknet";
import { useProvider } from "@starknet-react/core";
interface AddContractArtifactsProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
}

type ContractSource = "rpc" | "manual";
type RpcMode = "class_hash" | "address";

const AddContractArtifacts: React.FC<AddContractArtifactsProps> = ({ isOpen, onOpenChange }) => {
	const [compiledContracts, setCompiledContracts] = useAtom(compiledContractsAtom);
	const { provider } = useProvider();

	const [contractSource, setContractSource] = useState<ContractSource>("rpc");
	const [rpcMode, setRpcMode] = useState<RpcMode>("class_hash");
	const [classHash, setClassHash] = useState("");
	const [compiledClassHash, setCompiledClassHash] = useState("");
	const [contractAddress, setContractAddress] = useState("");
	const [contractName, setContractName] = useState("");
	const [sierraProgram, setSierraProgram] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleAddContract = async (): Promise<void> => {
		setIsLoading(true);
		setError(null);

		try {
			let newContract: Contract;

			if (contractSource === "rpc") {
				if (provider === null) {
					throw new Error("Provider not available");
				}

				let finalClassHash = classHash;
				if (rpcMode === "address") {
					const fetchedClassHash = await fetchClassHashAt(
						provider,
						contractAddress
					);
					if (fetchedClassHash === null) {
						throw new Error("Failed to fetch class hash for the contract address");
					}
					finalClassHash = fetchedClassHash;
				}

				const contractClass = await fetchContractClass(
					provider,
					finalClassHash
				);

				if (contractClass === null) {
					throw new Error("Failed to fetch contract class");
				}

				newContract = {
					...contractClass,
					name: contractName !== "" ? contractName : "Contract from RPC",
					classHash: finalClassHash,
					address: rpcMode === "address" ? contractAddress : ""
				};
			} else {
				// Manual mode
				try {
					const parsedSierra = JSON.parse(sierraProgram) as CompiledSierra;
					const parsedCasm = JSON.parse(compiledClassHash) as CairoAssembly;

					if (!Array.isArray(parsedSierra?.abi)) {
						throw new Error("Sierra program must contain a valid ABI array");
					}

					// Calculate class hash from Sierra program
					const calculatedClassHash = hash.computeSierraContractClassHash(parsedSierra);
					const calculatedCompiledClassHash = hash.computeCompiledClassHash(parsedCasm);

					newContract = {
						name: contractName !== "" ? contractName : "Manual Contract",
						abi: parsedSierra.abi as Abi,
						classHash: calculatedClassHash,
						compiledClassHash: calculatedCompiledClassHash,
						address: "",
						sierraClassHash: "",
						sierra: parsedSierra,
						casm: parsedCasm,
						deployedInfo: [],
						declaredInfo: []
					};
				} catch (err) {
					if (err instanceof Error) {
						throw new Error(`Invalid JSON format: ${err.message}`);
					}
					throw new Error("Invalid JSON format");
				}
			}

			setCompiledContracts([...compiledContracts, newContract]);
			resetForm();
			onOpenChange(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setIsLoading(false);
		}
	};

	const resetForm = (): void => {
		setClassHash("");
		setCompiledClassHash("");
		setContractAddress("");
		setContractName("");
		setSierraProgram("");
		setContractSource("rpc");
		setRpcMode("class_hash");
		setError(null);
	};

	return (
		<Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
			<Dialog.Portal>
				<Dialog.Overlay className="add-contract-overlay" />
				<Dialog.Content className="add-contract-content">
					<div className="add-contract-header">
						<Dialog.Title className="add-contract-title">Add Contract Artifacts</Dialog.Title>
						<Dialog.Close asChild>
							<button className="close-button" aria-label="Close">
								<BsX size={20} />
							</button>
						</Dialog.Close>
					</div>

					<div className="add-contract-form">
						<div className="form-group">
							<label>Contract Source</label>
							<div className="source-toggle">
								<button
									className={`source-button ${contractSource === "rpc" ? "active" : ""}`}
									onClick={(): void => {
										setContractSource("rpc");
									}}
								>
									Fetch from RPC
								</button>
								<button
									className={`source-button ${contractSource === "manual" ? "active" : ""}`}
									onClick={(): void => {
										setContractSource("manual");
									}}
								>
									Manual Input
								</button>
							</div>
						</div>

						{contractSource === "rpc" && (
							<div className="form-group">
								<label>RPC Mode</label>
								<div className="source-toggle">
									<button
										className={`source-button ${rpcMode === "class_hash" ? "active" : ""}`}
										onClick={(): void => {
											setRpcMode("class_hash");
										}}
									>
										Class Hash
									</button>
									<button
										className={`source-button ${rpcMode === "address" ? "active" : ""}`}
										onClick={(): void => {
											setRpcMode("address");
										}}
									>
										Contract Address
									</button>
								</div>
							</div>
						)}

						<div className="form-group">
							<label>Contract Name</label>
							<input
								type="text"
								placeholder="Enter contract name"
								value={contractName}
								onChange={(e): void => {
									setContractName(e.target.value);
								}}
								className="form-input"
							/>
						</div>

						{contractSource === "rpc" && rpcMode === "class_hash" && (
							<div className="form-group">
								<label>Class Hash</label>
								<input
									type="text"
									placeholder="Enter class hash"
									value={classHash}
									onChange={(e): void => {
										setClassHash(e.target.value);
									}}
									className="form-input"
								/>
							</div>
						)}

						{contractSource === "rpc" && rpcMode === "address" && (
							<div className="form-group">
								<label>Contract Address</label>
								<input
									type="text"
									placeholder="Enter contract address"
									value={contractAddress}
									onChange={(e): void => {
										setContractAddress(e.target.value);
									}}
									className="form-input"
								/>
							</div>
						)}

						{contractSource === "manual" && (
							<>
								<div className="form-group">
									<label>Sierra Program (JSON format)</label>
									<textarea
										placeholder="Paste Sierra program in JSON format (must include ABI field)"
										value={sierraProgram}
										onChange={(e): void => {
											setSierraProgram(e.target.value);
										}}
										className="form-input"
										rows={8}
									/>
								</div>
								<div className="form-group">
									<label>CASM Program (JSON format)</label>
									<textarea
										placeholder="Paste CASM program in JSON format"
										value={compiledClassHash}
										onChange={(e): void => {
											setCompiledClassHash(e.target.value);
										}}
										className="form-input"
										rows={8}
									/>
								</div>
							</>
						)}

						{error !== null && (
							<div className="error-message">
								{error}
							</div>
						)}

						<div className="form-actions">
							<button
								onClick={(): void => {
									resetForm();
									onOpenChange(false);
								}}
								className="cancel-button"
								disabled={isLoading}
							>
								Cancel
							</button>
							<button
								onClick={(): void => {
									void handleAddContract();
								}}
								className="confirm-button"
								disabled={
									isLoading ||
									(contractSource === "rpc" && rpcMode === "class_hash" && classHash === "") ||
									(contractSource === "rpc" && rpcMode === "address" && contractAddress === "") ||
									(contractSource === "manual" && (sierraProgram === "" || compiledClassHash === ""))
								}
							>
								{isLoading ? "Loading..." : "Add Contract"}
							</button>
						</div>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
};

export default AddContractArtifacts;
