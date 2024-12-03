import React from "react";
import "./settings.css";
import { BsChevronDown } from "react-icons/bs";
import { useAtom, useAtomValue } from "jotai";
import { cairoVersionAtom, versionsAtom } from "../../atoms/cairoVersion";
import ExplorerSelector, { useCurrentExplorer } from "../ExplorerSelector";
import * as Select from "../ui_components/Select";

export const Settings: React.FC = () => {
	const [cairoVersion, setCairoVersion] = useAtom(cairoVersionAtom);
	const getVersions = useAtomValue(versionsAtom);
	const explorerHook = useCurrentExplorer();

	return (
		<div className={"settings-wrapper"}>
			<div className={"text-center font-bold w-full"}>Settings</div>
			<div className={"settings-box"}>
				<div className={"settings-box-header"}>Cairo Version</div>
				<div className={"blank"}></div>
				<div className={"settings-box-content"}>
					<Select.Root value={cairoVersion} onValueChange={setCairoVersion}>
						<Select.Trigger className="flex flex-row justify-between align-items-center devnet-trigger-wrapper w-100">
							<Select.Value>
								<div className="flex flex-column align-items-center m-0">
									<p>{cairoVersion}</p>
								</div>
							</Select.Value>
							<Select.Icon>
								<BsChevronDown />
							</Select.Icon>
						</Select.Trigger>
						<Select.Portal>
							<Select.Content>
								<Select.Viewport>
									{getVersions.map((v, i) => (
										<Select.Item value={v} key={v}>
											<Select.ItemText>{v}</Select.ItemText>
										</Select.Item>
									))}
								</Select.Viewport>
							</Select.Content>
						</Select.Portal>
					</Select.Root>
				</div>
			</div>

			<div className={"settings-box"}>
				<div className={"settings-box-header"}>Explorer</div>
				<div className={"blank"}></div>
				<div className={"settings-box-content"}>
					<ExplorerSelector
						controlHook={explorerHook}
						isInline={false}
						isTextVisible={true}
					/>
				</div>
			</div>
		</div>
	);
};
