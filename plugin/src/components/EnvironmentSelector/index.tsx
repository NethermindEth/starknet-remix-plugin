import React, { useEffect } from "react";
import { devnets } from "../../utils/network";

import "./styles.css";
import { customDevnetUrlAtom, devnetAtom, envAtom, envName, isCustomDevnetConnectedAtom } from "../../atoms/environment";
import { useAtom, useSetAtom } from "jotai";
import useProvider from "../../hooks/useProvider";
import { BsChevronDown, BsPlugFill, BsPlug } from "react-icons/bs";
import * as Select from "../../components/ui_components/Select";
import { DevnetStatus } from "../DevnetStatus";

const EnvironmentSelector: React.FC = () => {
	const { setProvider } = useProvider();
	const [env, setEnv] = useAtom(envAtom);
	const setDevnet = useSetAtom(devnetAtom);
	const [customUrl, setCustomUrl] = useAtom(customDevnetUrlAtom);
	const [isConnected, setIsConnected] = useAtom(isCustomDevnetConnectedAtom);

	// Initialize devnet configuration when in custom devnet mode
	useEffect(() => {
		if (env === "customDevnet" && isConnected) {
			setDevnet({ name: "Custom Devnet", url: customUrl });
			setProvider(null);
		}
	}, []);

	const handleEnvironmentChange = (ipValue: string): void => {
		const value = parseInt(ipValue);
		if (!isNaN(value) && value > 0) {
			setDevnet(
				value === 1
					? {
						name: "Custom Devnet",
						url: customUrl
					}
					: devnets[value - 1]
			);
			switch (value) {
				case 1:
					setEnv("customDevnet");
					// Don't reset connection state when switching to custom devnet
					break;
				case 2:
					setEnv("remoteDevnet");
					break;
				case 3:
					setEnv("localKatanaDevnet");
					break;
			}
			setProvider(null);
			return;
		}
		setEnv("wallet");
	};

	const handleCustomUrlChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
		if (!isConnected) {
			const url = e.target.value;
			setCustomUrl(url);
		}
	};

	const handleConnectToggle = (): void => {
		if (isConnected) {
			// Disconnect
			setIsConnected(false);
			setProvider(null);
		} else {
			// Connect
			setIsConnected(true);
			setDevnet({ name: "Custom Devnet", url: customUrl });
			setProvider(null);
		}
	};

	return (
		<div className="environment-selector-wrapper">
			<div className="devnet-selection-status-wrapper">
				<Select.Root onValueChange={handleEnvironmentChange}>
					<Select.Trigger className="flex flex-row justify-content-space-between align-items-center p-2 br-1 devnet-trigger-wrapper">
						<Select.Value placeholder={envName(env)}>{envName(env)}</Select.Value>
						<Select.Icon>
							<BsChevronDown />
						</Select.Icon>
					</Select.Trigger>

					<Select.Portal>
						<Select.Content>
							<Select.Viewport>
								<Select.Item value="0" className="text-light text-sm m-0">
									<Select.ItemText>Wallet</Select.ItemText>
								</Select.Item>
								{devnets.map((devnet, i) => (
									<Select.Item
										key={i.toString() + devnet?.name}
										value={(i + 1).toString()}
									>
										<Select.ItemText>{devnet?.name}</Select.ItemText>
									</Select.Item>
								))}
							</Select.Viewport>
						</Select.Content>
					</Select.Portal>
				</Select.Root>

				<DevnetStatus />
			</div>

			{env === "customDevnet" && (
				<div className="custom-url-input-wrapper">
					<div className="custom-url-row">
						<input
							type="text"
							placeholder="Enter custom devnet URL"
							value={customUrl}
							onChange={handleCustomUrlChange}
							className="custom-url-input"
							disabled={isConnected}
							readOnly={isConnected}
						/>
						<button
							onClick={handleConnectToggle}
							className={`custom-url-button ${isConnected ? "connected" : "disconnected"}`}
							aria-label={isConnected ? "Connected to devnet" : "Connect to devnet"}
							title={isConnected ? "Connected" : "Connect"}
						>
							{isConnected ? <BsPlugFill size={16} /> : <BsPlug size={16} />}
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default EnvironmentSelector;
