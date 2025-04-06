import React, { useEffect, useState } from "react";
import copy from "copy-to-clipboard";
import "./styles.css";
import { MdCheck, MdCopyAll } from "react-icons/md";
import { type Network, ETH_TOKEN_ADDRESS, ERC20_ABI, RPC_URLS } from "../../utils/constants";
import { useCurrentExplorer } from "../ExplorerSelector";
import { getExplorerUrl, trimStr } from "../../utils/utils";
import { useAccount, useNetwork, useProvider } from "@starknet-react/core";
import ConnectModal from "../starknet/connect";
import DisconnectModal from "../starknet/disconnect";
import { formatWalletAddress, getChainName } from "../../utils/starknet";
import useAccountAtom from "../../hooks/useAccount";
import useProviderAtom from "../../hooks/useProvider";
import { declTxHashAtom, deployTxHashAtom } from "../../atoms/deployment";
import { invokeTxHashAtom } from "../../atoms/interaction";
import { atom, useSetAtom } from "jotai";
import { RpcProvider, Contract } from "starknet";

export const walletBalanceAtom = atom<string | bigint | null>(null);

const Wallet: React.FC = () => {
	const [showCopied, setCopied] = useState(false);

	const {
		status,
		account,
		address,
		connector
	} = useAccount();
	const { chain } = useNetwork();
	const { provider } = useProvider();

	const { setAccount } = useAccountAtom();
	const { setProvider } = useProviderAtom();

	const setDeclTxHash = useSetAtom(declTxHashAtom);
	const setDeployTxHash = useSetAtom(deployTxHashAtom);
	const setInvokeTxHash = useSetAtom(invokeTxHashAtom);
	const setBalance = useSetAtom(walletBalanceAtom);

	useEffect(() => {
		if (status === "connected") {
			setAccount(account ?? null);
			setProvider(provider);
		} else {
			setAccount(null);
			setProvider(null);
			setBalance(null);
		}
		setDeployTxHash("");
		setDeclTxHash("");
		setInvokeTxHash("");
	}, [status]);

	useEffect(() => {
		const fetchBalance = async (): Promise<void> => {
			try {
				const networkName = getChainName(chain.id.toString() ?? "").toLowerCase();
				const rpcUrl = networkName === "mainnet" ? RPC_URLS.mainnet : RPC_URLS.sepolia;

				const customProvider = new RpcProvider({
					nodeUrl: rpcUrl
				});

				const ethContract = new Contract(
					ERC20_ABI,
					ETH_TOKEN_ADDRESS,
					customProvider
				);

				const balanceResponse = await ethContract.balanceOf(address);
				const balanceValue = balanceResponse.balance;

				setBalance(balanceValue);
			} catch (error) {
				console.error("Error fetching wallet balance:", error);
			}
		};

		const isConnectedWithAddress = status === "connected" && address !== undefined && address !== null;

		if (isConnectedWithAddress) {
			fetchBalance().catch(console.error);
		}
	}, [status, address, chain.id]);

	const formattedAddress = formatWalletAddress(address);
	const explorerHook = useCurrentExplorer();

	return (
		<div
			className="flex"
			style={{
				display: "flex",
				flexDirection: "column",
				gap: "1rem",
				padding: "1rem 0rem"
			}}
		>
			{status === "connected"
				? (
					<>
						<div className="wallet-row-wrapper">
							<div className="wallet-wrapper">
								<img src={connector?.icon?.dark} alt="wallet icon" />
								<p className="text"> {connector?.id}</p>
								<p className="text text-right text-secondary">
									{" "}
									{getChainName(chain.id.toString() ?? "")}
								</p>
							</div>
						</div>
						<div className="wallet-account-wrapper">
							<p className="text account" title={formattedAddress !== undefined && formattedAddress !== null ? formattedAddress : ""}>
								<a
									href={`${getExplorerUrl(
										explorerHook.explorer,
										getChainName(chain.id.toString() ?? "") as Network
									)}/contract/${formattedAddress !== undefined && formattedAddress !== null ? formattedAddress : ""}`}
									target="_blank"
									rel="noreferer noopener noreferrer"
								>
									{trimStr(formattedAddress !== undefined && formattedAddress !== null ? formattedAddress : "", 10)}
								</a>
							</p>
							<span style={{ position: "relative" }}>
								<button
									className="btn p-0"
									onClick={() => {
										copy(formattedAddress !== undefined && formattedAddress !== null ? formattedAddress : "");
										setCopied(true);
										setTimeout(() => {
											setCopied(false);
										}, 1000);
									}}
								>
									{showCopied ? <MdCheck /> : <MdCopyAll />}
								</button>
							</span>
						</div>
						<div className="wallet-actions">
							<DisconnectModal />
						</div>
					</>
				)
				: (
					<>
						{status === "disconnected"
							? (
								<ConnectModal />
							)
							: (
								<>
									{status === "connecting"
										? (
											<p>Connecting...</p>
										)
										: (
											<p>Reconnecting...</p>
										)}
								</>
							)}
					</>
				)}
		</div>
	);
};

export default Wallet;
