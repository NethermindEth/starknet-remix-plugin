import React from "react";
import DevnetAccountSelector from "../../components/DevnetAccountSelector";
import "./styles.css";
import EnvironmentSelector from "../../components/EnvironmentSelector";
import Wallet from "../../components/Wallet";
import { useAtomValue } from "jotai";
import { envAtom } from "../../atoms/environment";
import Accordion, { AccordionContent, AccordionItem, AccordionTrigger } from "../../components/ui_components/Accordion";
import { CurrentEnv } from "../../components/CurrentEnv";

const DEVNET_ENVIRONMENTS: string[] = ["customDevnet", "remoteDevnet", "localKatanaDevnet"];

const EnvironmentTab: React.FC<{ env: string }> = ({ env }) => {
	const isDevnetEnv = DEVNET_ENVIRONMENTS.includes(env);

	return (
		<div className="flex flex-column">
			<div>
				<div className="flex flex-column">
					<label>Environment selection</label>
					<div className="flex_dot">
						<div className="env-selector-wrapper">
							<EnvironmentSelector />
						</div>
					</div>
				</div>
				<div className="flex flex-column">
					{isDevnetEnv ? <DevnetAccountSelector /> : <Wallet />}
				</div>
			</div>
		</div>
	);
};

const Environment: React.FC = () => {
	const env = useAtomValue(envAtom);

	return (
		<Accordion type="single" collapsible defaultValue={undefined}>
			<AccordionItem value="env">
				<AccordionTrigger>
					<CurrentEnv />
				</AccordionTrigger>
				<AccordionContent>
					<div className="starknet-connection-component">
						<EnvironmentTab env={env} />
					</div>
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	);
};

export { Environment };
