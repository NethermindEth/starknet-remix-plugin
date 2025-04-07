import React, { useState } from "react";
import copy from "copy-to-clipboard";
import "./styles.css";
import { MdCheck, MdCopyAll } from "react-icons/md";
import { useCurrentExplorer } from "../ExplorerSelector";
import { getExplorerUrl, trimStr } from "../../utils/utils";
import { useAccount, useNetwork } from "@starknet-react/core";
import ConnectModal from "../starknet/connect";
import DisconnectModal from "../starknet/disconnect";
import { formatWalletAddress, getChainName } from "../../utils/starknet";
import { Network } from "@/utils/constants";

const Wallet: React.FC = () => {
	const [showCopied, setCopied] = useState(false);

	const {
		status,
		address,
		connector
	} = useAccount();

	const { chain } = useNetwork();

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
								<img src={connector !== undefined ? (typeof connector.icon === "string" ? connector.icon : connector.icon.dark) : ""} alt="wallet icon" />
								<p className="text"> {connector?.id}</p>
								<p className="text text-right text-secondary">
									{" "}
									{getChainName(chain.id.toString() ?? "")}
								</p>
							</div>
						</div>
						<div className="wallet-account-wrapper">
							<p className="text account" title={formattedAddress ?? ""}>
								<a
									href={`${getExplorerUrl(
										explorerHook.explorer,
										getChainName(chain.id.toString() ?? "") as Network
									)}/contract/${formattedAddress ?? ""}`}
									target="_blank"
									rel="noreferer noopener noreferrer"
								>
									{trimStr(formattedAddress ?? "", 10)}
								</a>
							</p>
							<span style={{ position: "relative" }}>
								<button
									className="btn p-0"
									onClick={() => {
										copy(formattedAddress ?? "");
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
