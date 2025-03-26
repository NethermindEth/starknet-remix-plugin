import React, { useState } from "react";
import { getContractNameFromFullName, getShortenedHash } from "../../utils/utils";
import { useAtom } from "jotai";
import {
	compiledContractsAtom,
	selectedCompiledContract,
	deployedContractsAtom,
	selectedDeployedContract
} from "../../atoms/compiledContracts";
import * as Select from "../../components/ui_components/Select";
import { ChevronDownIcon, TrashIcon } from "lucide-react";

interface CompiledContractsProps {
	show: "class" | "contract";
}

const CompiledContracts: React.FC<CompiledContractsProps> = (props): React.ReactElement => {
	const [compiledContracts, setCompiledContracts] = useAtom(compiledContractsAtom);
	const [selectedCompiled, setSelectedCompiled] = useAtom(selectedCompiledContract);
	const [deployedContracts, setDeployedContracts] = useAtom(deployedContractsAtom);
	const [selectedDeployed, setSelectedDeployed] = useAtom(selectedDeployedContract);

	const contracts = props.show === "class" ? compiledContracts : deployedContracts;
	const selectedContract = props.show === "class" ? selectedCompiled : selectedDeployed;
	const setSelectedContract = props.show === "class" ? setSelectedCompiled : setSelectedDeployed;
	const setContracts = props.show === "class" ? setCompiledContracts : setDeployedContracts;

	const [selectedContractIdx, setSelectedContractIdx] = useState("0");

	const handleContractSelectionChange = (value: string): void => {
		console.log("handleContractSelectionChange", value);
		setSelectedContract(contracts[parseInt(value)]);
		setSelectedContractIdx(value);
	};

	const handleDeleteContract = (
		event: React.MouseEvent<HTMLButtonElement>,
		index: number
	): void => {
		event.stopPropagation();
		setContracts((prevContracts) => prevContracts.filter((_, i) => i !== index));

		if (contracts.length === 0) {
			setSelectedContract(null);
		} else {
			setSelectedContract(contracts[0]);
			setSelectedContractIdx("0");
		}
	};

	if (contracts.length === 0) return <></>;

	return (
		<Select.Root
			value={selectedContractIdx}
			onValueChange={(value) => {
				handleContractSelectionChange(value);
			}}
		>
			<Select.Trigger className="flex justify-between select-trigger-deployment">
				<Select.Value
					placeholder={
						selectedContract != null
							? `${getContractNameFromFullName(selectedContract.name)} (${getShortenedHash(
								selectedContract.classHash ?? "",
								6,
								4
							)})`
							: `No ${props.show === "class" ? "compiled" : "deployed"} contract selected`
					}
				/>
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
								isSelected={props.show === "class" ? selectedContract?.classHash === contract.classHash : selectedContract?.address === contract.address}
							>
								{`${getContractNameFromFullName(contract.name)} (${props.show === "class"
									? getShortenedHash(
										contract.classHash ?? "",
										6,
										4
									)
									: getShortenedHash(
										contract.address ?? "",
										6,
										4
									)})`}
							</SelectItemWithDelete>
						))}
					</Select.Viewport>
				</Select.Content>
			</Select.Portal>
		</Select.Root>
	);
};

const SelectItemWithDelete = React.forwardRef(
	(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		{ children, onDelete, index, value, ...props }: any,
		ref: React.Ref<HTMLDivElement>
	): React.ReactElement => (
		<div className="SelectItemWithDelete">
			<Select.Item {...props} ref={ref} value={value} className="w-full">
				<Select.ItemText>{children}</Select.ItemText>
			</Select.Item>

			<button
				onClick={(event) => onDelete(event, index)}
				className={"ml-2 p-1 rounded deleteButton"}
			>
				<TrashIcon size={16} />
			</button>
		</div>
	)
);

SelectItemWithDelete.displayName = "SelectItemWithDelete";

export default CompiledContracts;
