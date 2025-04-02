import React, { useEffect, useState } from "react";

import { Environment } from "../Environment";
import "./styles.css";

import Compilation from "../Compilation";
import Deployment from "../Deployment";
import Interaction from "../Interaction";
import Accordion, { AccordionContent, AccordionItem, AccordionTrigger } from "../../components/ui_components/Accordion";
import TransactionHistory from "../TransactionHistory";
import Footer from "../Footer";
import StateAction from "../../components/StateAction";
import BackgroundNotices from "../../components/BackgroundNotices";
import { useCurrentExplorer } from "../../components/ExplorerSelector";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { deploymentAtom, isDelcaringAtom } from "../../atoms/deployment";
import { pluginLoaded as atomPluginLoaded } from "../../atoms/remixClient";
import useRemixClient from "../../hooks/useRemixClient";
import * as Tabs from "@radix-ui/react-tabs";
import { Settings } from "../../components/Settings";
import { cairoVersionAtom, versionsAtom } from "../../atoms/cairoVersion";
import { apiUrl, getAccounts } from "../../utils/network";
import { StarknetProvider } from "../../components/starknet/starknet-provider";
import { CompilationStatus, statusAtom } from "../../atoms/compilation";
import { useApi } from "../../utils/api";
import {
	availableDevnetAccountsAtom,
	devnetAtom,
	envAtom,
	isDevnetAliveAtom,
} from "../../atoms/environment";
import { devnetAccountAtom } from "../../atoms/connection";

export type AccordionTabs = "compile" | "deploy" | "interaction" | "transactions" | "";

const Plugin: React.FC = () => {
	const status = useAtomValue(statusAtom);

	const {
		isDeploying,
		deployStatus
	} = useAtomValue(deploymentAtom);

	const isDeclaring = useAtomValue(isDelcaringAtom);

	const isDeclaringOrDeploying = isDeploying || isDeclaring;

	// Interaction state variables
	const [interactionStatus, setInteractionStatus] = useState<
	"loading" | "success" | "error" | ""
	>("");

	const [currentAccordion, setCurrentAccordion] = useState<AccordionTabs>("compile");

	// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
	const handleTabView = (clicked: AccordionTabs) => {
		if (currentAccordion === clicked) {
			setCurrentAccordion("");
		} else {
			setCurrentAccordion(clicked);
		}
	};

	const setCairoVersion = useSetAtom(cairoVersionAtom);
	const setVersions = useSetAtom(versionsAtom);
	const { remixClient } = useRemixClient();
	const api = useApi(apiUrl);

	const envViteVersion: string | undefined = import.meta.env.VITE_VERSION;
	const pluginVersion = envViteVersion !== undefined ? `v${envViteVersion}` : "v0.2.5";

	useEffect(() => {
		setTimeout(() => {
			const fetchCairo = async (): Promise<void> => {
				const versions = await api.allowedVersions();

				if (versions.data !== null && versions.data.length > 0) {
					setCairoVersion(versions.data[0]);
					setVersions(versions.data);
				} else {
					// TODO: remove notification call
					// await remixClient.call(
					// 	"notification" as any,
					// 	"toast",
					// 	"🔴 Failed to fetch cairo versions from the compilation server"
					// );
					console.error(versions);
				}
			};
			fetchCairo().catch((e) => {
				console.error(e);
			});
		}, 10000);
	}, [remixClient]);

	const explorerHook = useCurrentExplorer();

	const setPluginLoaded = useSetAtom(atomPluginLoaded);

	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		const id = setTimeout(async (): Promise<void> => {
			await remixClient.onload(() => {
				setPluginLoaded(true);
			});
		}, 1);
		return () => {
			clearInterval(id);
		};
	}, []);

	const devnet = useAtomValue(devnetAtom);
	const [isDevnetAlive, setIsDevnetAlive] = useAtom(isDevnetAliveAtom);
	const [availableDevnetAccounts, setAvailableDevnetAccounts] = useAtom(
		availableDevnetAccountsAtom
	);
	const setDevnetAccount = useSetAtom(devnetAccountAtom);
	const env = useAtomValue(envAtom);

	const checkDevnetUrl = async (): Promise<void> => {
		try {
			const isKatanaEnv = env === "localKatanaDevnet";
			const response = await fetch(`${devnet.url}/${isKatanaEnv ? "" : "is_alive"}`, {
				method: "GET",
				redirect: "follow",
				headers: {
					"Content-Type": "application/json"
				}
			});
			const status = await response.text();
			if (isKatanaEnv) {
				const jsonStatus: { health: boolean } = JSON.parse(status);
				if (jsonStatus.health) {
					setIsDevnetAlive(true);
				} else {
					setIsDevnetAlive(false);
				}
			} else if (status !== "Alive!!!" || response.status !== 200) {
				setIsDevnetAlive(false);
			} else {
				setIsDevnetAlive(true);
			}
		} catch (error) {
			setIsDevnetAlive(false);
		}
	};

	const refreshDevnetAccounts = async (): Promise<void> => {
		try {
			const accounts = await getAccounts(devnet.url, env === "localKatanaDevnet");
			if (JSON.stringify(accounts) !== JSON.stringify(availableDevnetAccounts)) {
				if (accounts !== undefined) {
					setAvailableDevnetAccounts(accounts);
				} else {
					setAvailableDevnetAccounts([]);
				}
			}
		} catch (e) {
			setAvailableDevnetAccounts([]);
			await remixClient.terminal.log({
				type: "error",
				value: `Failed to get accounts information from ${devnet.url}`
			});
		}
	};

	// Check devnet status periodically
	useEffect(() => {
		const interval = setInterval(() => {
			checkDevnetUrl().catch((e) => {
				console.error(e);
			});
		}, 3000);
		return () => {
			clearInterval(interval);
		};
	}, [devnet]);

	// Initialize accounts and provider when devnet status changes
	useEffect(() => {
		if (!isDevnetAlive) {
			setAvailableDevnetAccounts([]);
			setDevnetAccount(null);
		} else {
			refreshDevnetAccounts().catch((e) => {
				console.error(e);
			});
		}
	}, [devnet, isDevnetAlive]);

	return (
		<StarknetProvider>
			<div className="plugin-wrapper">
				<div className="plugin-main-wrapper">
					<div className={"plugin-version-wrapper"}>
						<div className={"plugin-version-label"}>ALPHA</div>
						<div className={"plugin-version"}>Using {pluginVersion}</div>
					</div>
					<div>
						<Environment />
					</div>

					<Tabs.Root defaultValue={"home"}>
						<Tabs.List className={"tab-list"}>
							<Tabs.Trigger value={"home"} className={"tabs-trigger"}>
								Home
							</Tabs.Trigger>
							<Tabs.Trigger value={"transactions"} className={"tabs-trigger"}>
								Transactions
							</Tabs.Trigger>
							<Tabs.Trigger value={"info"} className={"tabs-trigger"}>
								Info
							</Tabs.Trigger>
							<Tabs.Trigger value={"settings"} className={"tabs-trigger"}>
								Settings
							</Tabs.Trigger>
						</Tabs.List>

						<Tabs.Content value="home">
							<Accordion
								type="single"
								value={currentAccordion}
								defaultValue={"compile"}
							>
								<AccordionItem value="compile">
									<AccordionTrigger
										onClick={() => {
											handleTabView("compile");
										}}
									>
										<span
											className="d-flex align-items-center"
											style={{ gap: "0.5rem" }}
										>
											<span className={"Accordion-list-number"}>1</span>
											<p style={{ all: "unset" }}>Compile</p>
											<StateAction
												value={
													status === CompilationStatus.Compiling
														? "loading"
														: status === CompilationStatus.Success
															? "success"
															: status === CompilationStatus.Error
																? "error"
																: ""
												}
											/>
										</span>
									</AccordionTrigger>
									<AccordionContent>
										<Compilation setAccordion={setCurrentAccordion} />
									</AccordionContent>
								</AccordionItem>

								<AccordionItem value="deploy">
									<AccordionTrigger
										onClick={() => {
											handleTabView("deploy");
										}}
									>
										<span
											className="d-flex align-items-center"
											style={{ gap: "0.5rem" }}
										>
											<span className={"Accordion-list-number"}>2</span>
											<p style={{ all: "unset" }}>Deploy</p>
											<StateAction
												value={
													isDeclaringOrDeploying
														? "loading"
														: deployStatus === "ERROR"
															? "error"
															: deployStatus === "DONE"
																? "success"
																: ""
												}
											/>
										</span>
									</AccordionTrigger>
									<AccordionContent>
										<Deployment setActiveTab={setCurrentAccordion} />
									</AccordionContent>
								</AccordionItem>
								<AccordionItem value="interaction">
									<AccordionTrigger
										onClick={() => {
											handleTabView("interaction");
										}}
									>
										<span
											className="d-flex align-items-center"
											style={{ gap: "0.5rem" }}
										>
											<span className={"Accordion-list-number"}>3</span>
											<p style={{ all: "unset" }}>Interact</p>
											<StateAction value={interactionStatus} />
										</span>
									</AccordionTrigger>
									<AccordionContent>
										<Interaction setInteractionStatus={setInteractionStatus} />
									</AccordionContent>
								</AccordionItem>
							</Accordion>
						</Tabs.Content>

						<Tabs.Content value="transactions">
							<TransactionHistory controlHook={explorerHook} />
						</Tabs.Content>

						<Tabs.Content value="info">
							<BackgroundNotices />
						</Tabs.Content>

						<Tabs.Content value={"settings"}>
							<Settings />
						</Tabs.Content>
					</Tabs.Root>
					<div className={"blank-placeholder"}></div>
				</div>
				<Footer />
			</div>
		</StarknetProvider>
	);
};

export default Plugin;
