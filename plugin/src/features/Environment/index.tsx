/* eslint-disable multiline-ternary */
import React from "react";
import DevnetAccountSelector from "../../components/DevnetAccountSelector";
import "./styles.css";

import EnvironmentSelector from "../../components/EnvironmentSelector";
import Wallet from "../../components/Wallet";
import ManualAccount from "../../components/ManualAccount";
import { useAtom } from "jotai";
import { envAtom } from "../../atoms/environment";
import * as Tabs from "@radix-ui/react-tabs";
import Accordian, { AccordionContent, AccordionItem, AccordionTrigger } from "../../components/ui_components/Accordian";
import { CurrentEnv } from "../../components/CurrentEnv";
import { DevnetStatus } from "../../components/DevnetStatus";

const Environment: React.FC = () => {
	const [env, setEnv] = useAtom(envAtom);

	return (
		<Accordian className={"accordian-env"} type={"single"} defaultValue={"closed"}>
			<AccordionItem value={"closed"}></AccordionItem>
			<AccordionItem value={"env"} className={"accordian-item-env"}>
				<AccordionTrigger className={"accordian-trigger-env"}>
					<CurrentEnv />
				</AccordionTrigger>

				<AccordionContent className={"accordian-content-env"}>
					<div className="starknet-connection-component">
						<Tabs.Root
							defaultValue={env === "manual" ? "test-accounts" : "environment"}
							onValueChange={(e: any) => {
								if (e === "environment") {
									setEnv("remoteDevnet");
								} else {
									setEnv("manual");
								}
							}}
						>
							<Tabs.List
								className={"flex justify-between rounded tab-list tab-header-env"}
							>
								<Tabs.List className={"tabs-trigger"}></Tabs.List>
								<Tabs.Trigger className={"tabs-trigger"} value={"environment"}>
									Environment
								</Tabs.Trigger>
								<Tabs.Trigger className={"tabs-trigger"} value={"test-accounts"}>
									Test Accounts
								</Tabs.Trigger>
								<Tabs.List className={"tabs-trigger"}></Tabs.List>
							</Tabs.List>

							<Tabs.Content value={"environment"} className={"tabs-content-env"}>
								<div>
									<div className="flex flex-column">
										{env !== "manual" ? (
											<div>
												<div className="flex flex-column">
													<label className="">
														Environment selection
													</label>
													<div className="flex_dot">
														<div className={"env-selector-wrapper"}>
															<EnvironmentSelector />
														</div>
														<DevnetStatus />
													</div>
												</div>
												<div className="flex flex-column">
													{[
														"localDevnet",
														"remoteDevnet",
														"localKatanaDevnet"
													].includes(env) ? (
															<DevnetAccountSelector />
														) : (
															<Wallet />
														)}
												</div>
											</div>
										) : (
											<ManualAccount />
										)}
									</div>
								</div>
							</Tabs.Content>
							<Tabs.Content value={"test-accounts"}>
								<ManualAccount />
							</Tabs.Content>
						</Tabs.Root>
					</div>
				</AccordionContent>
			</AccordionItem>
		</Accordian>
	);
};

export { Environment };
