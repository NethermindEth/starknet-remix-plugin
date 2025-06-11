import React from "react";
import { networkExplorerUrls as EXPLORERS } from "../../utils/constants";

import "./styles.css";
import { type IExplorerSelector, type IUseCurrentExplorer } from "../../utils/misc";
import { BsChevronDown } from "react-icons/bs";
import { useAtom } from "jotai";
import { currentExplorerAtom } from "../../atoms/explorer";
import * as Select from "../ui_components/Select";

const VOYAGER_LOGO = "https://voyager.online/favicons/favicon-32x32.png";
const STARKSCAN_LOGO = "https://starkscan.co/img/company/favicon.ico";

const explorerToLogo = (explorer: keyof typeof EXPLORERS): string => {
	switch (explorer) {
		case "starkscan":
			return STARKSCAN_LOGO;
		case "voyager":
		default:
			return VOYAGER_LOGO;
	}
};

export const useCurrentExplorer = (): IUseCurrentExplorer => {
	const [currentExplorerKey, setCurrentExplorerKey] = useAtom(currentExplorerAtom);

	return {
		explorer: currentExplorerKey,
		setExplorer: setCurrentExplorerKey
	};
};

const ExplorerSelector: React.FC<IExplorerSelector> = ({
	controlHook
}) => {
	const {
		explorer,
		setExplorer
	} = controlHook;
	return (
		<div
			className={"flex selectors-wrapper-root"}
			onClick={(e) => {
				e.stopPropagation();
			}}
		>
			<div className="selectors-wrapper">
				<Select.Root
					value={explorer}
					onValueChange={(value) => {
						setExplorer(value as keyof typeof EXPLORERS);
					}}
				>
					<Select.Trigger className="network-dropdown-trigger">
						<Select.Value>
							<div>{controlHook.explorer}</div>
						</Select.Value>
						<Select.Icon>
							<div className={"flex flex-row justify-between align-items-center"}>
								<img
									className="img-explorer-logo"
									src={explorerToLogo(controlHook.explorer)}
								/>
								<div className={"blank pl-1"}></div>
								<BsChevronDown />
							</div>
						</Select.Icon>
					</Select.Trigger>
					<Select.Portal>
						<Select.Content>
							<Select.Viewport>
								{Object.keys(EXPLORERS).map((v: string): React.ReactNode => (
									<Select.Item value={v} key={v} className="styled-dropdown-item">
										<Select.ItemText>
											<img
												className="img-explorer-logo"
												src={explorerToLogo(v as keyof typeof EXPLORERS)}
											/>
											<p>{v}</p>
										</Select.ItemText>
									</Select.Item>
								))}
							</Select.Viewport>
						</Select.Content>
					</Select.Portal>
				</Select.Root>
			</div>
		</div>
	);
};

export default ExplorerSelector;
