import { getRoundedNumber, getShortenedHash, weiToEth } from "../../utils/utils";
import React, { useState } from "react";
import { Account, RpcProvider } from "starknet";
import { MdCheck, MdCopyAll } from "react-icons/md";
import "./styles.css";
import copy from "copy-to-clipboard";
import { useAtom, useAtomValue } from "jotai";
import {
	availableDevnetAccountsAtom,
	devnetAtom,
	envAtom,
	isDevnetAliveAtom,
	selectedDevnetAccountAtom
} from "../../atoms/environment";
import useAccount from "../../hooks/useAccount";
import useProvider from "../../hooks/useProvider";
import { BsCheck, BsChevronDown } from "react-icons/bs";
import * as Select from "../../components/ui_components/Select";

const DevnetAccountSelector: React.FC = () => {
	const {
		account,
		setAccount
	} = useAccount();
	const {
		provider,
		setProvider
	} = useProvider();
	const env = useAtomValue(envAtom);
	const devnet = useAtomValue(devnetAtom);
	const isDevnetAlive = useAtomValue(isDevnetAliveAtom);
	const [, setSelectedDevnetAccount] = useAtom(selectedDevnetAccountAtom);
	const availableDevnetAccounts = useAtomValue(availableDevnetAccountsAtom);

	const [showCopied, setCopied] = useState(false);
	const [accountIdx, setAccountIdx] = useState(0);

	function handleAccountChange (value: number): void {
		if (value === -1) {
			return;
		}
		setAccountIdx(value);
		setSelectedDevnetAccount(availableDevnetAccounts[value]);
		const newProvider = new RpcProvider({ nodeUrl: devnet.url });
		if (provider == null) setProvider(newProvider);
		setAccount(
			new Account(
				provider ?? newProvider,
				availableDevnetAccounts[value].address,
				availableDevnetAccounts[value].private_key
			)
		);
	}

	return (
		<div className="mt-2">
			<label className="">Devnet account selection</label>
			<div className="devnet-account-selector-wrapper">
				<Select.Root
					value={accountIdx.toString()}
					onValueChange={(value: string) => {
						handleAccountChange(parseInt(value));
					}}
				>
					<Select.Trigger
						className="flex flex-row justify-content-space-between align-items-center p-2 br-1 devnet-account-selector-trigger">
						<Select.Value placeholder="No accounts found">
							{availableDevnetAccounts !== undefined &&
							availableDevnetAccounts.length !== 0 &&
							availableDevnetAccounts[accountIdx]?.address !== undefined
								? getShortenedHash(
									availableDevnetAccounts[accountIdx]?.address,
									6,
									4
								)
								: "No accounts found"}
						</Select.Value>
						<Select.Icon>
							<BsChevronDown />
						</Select.Icon>
					</Select.Trigger>
					<Select.Portal>
						<Select.Content>
							<Select.Viewport>
								{isDevnetAlive &&
								availableDevnetAccounts !== undefined &&
								availableDevnetAccounts.length > 0
									? (
										availableDevnetAccounts.map((account, index) => (
											<Select.Item value={index.toString()} key={index}>
												<Select.ItemText>
													<div
														className={
															"flex flex-row justify-content-space-between align-items-center"
														}
													>
														<div>{`${getShortenedHash(account.address ?? "", 6, 4)} (${getRoundedNumber(weiToEth(env === "localKatanaDevnet" ? account.balance : account.initial_balance), 2)} ether)`}</div>
														{accountIdx === index && <BsCheck size={18} />}
													</div>
												</Select.ItemText>
											</Select.Item>
										))
									)
									: (
										<Select.Item value="-1" key={-1}>
											No accounts found
										</Select.Item>
									)}
							</Select.Viewport>
						</Select.Content>
					</Select.Portal>
				</Select.Root>
				<div className="position-relative">
					<button
						className="btn"
						onClick={() => {
							copy(account?.address ?? "");
							setCopied(true);
							setTimeout(() => {
								setCopied(false);
							}, 1000);
						}}
					>
						{showCopied ? <MdCheck /> : <MdCopyAll />}
					</button>
				</div>
			</div>
		</div>
	);
};

export default DevnetAccountSelector;
