import React from "react";
import "./styles.css";
import { BsChevronDown } from "react-icons/bs";
import { useAtom, useAtomValue } from "jotai";
import { cairoVersionAtom, versionsAtom } from "../../atoms/cairoVersion";
import ExplorerSelector, { useCurrentExplorer } from "../ExplorerSelector";
import * as Select from "../ui_components/Select";
import LoadingDots from "../LoadingDots";
import { testEngineAtom } from "../../atoms/testing";
import { type TestEngine } from "../../utils/api";

export const Settings: React.FC = () => {
	const [cairoVersion, setCairoVersion] = useAtom(cairoVersionAtom);
	const [testEngine, setTestEngine] = useAtom(testEngineAtom);
	const getVersions = useAtomValue(versionsAtom);
	const explorerHook = useCurrentExplorer();

	const updateTestEngine = (engine: TestEngine): void => {
		setTestEngine(engine);
	};

	return (
		<div className={"settings-wrapper"}>
			<div className={"text-center font-bold w-full"}>Settings</div>
			<div className={"settings-box"}>
				<div className={"settings-box-header"}>Cairo Version</div>
				<div className={"blank"}></div>
				<div className={"settings-box-content"}>
					{cairoVersion !== null
						? (
							<Select.Root value={cairoVersion} onValueChange={setCairoVersion}>
								<Select.Trigger
									className="flex flex-row justify-between align-items-center devnet-trigger-wrapper w-100">
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
						)
						: (
							<div>
								<LoadingDots message="Loading" />
							</div>
						)}
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

			<div className={"settings-box"}>
				<div className={"settings-box-header"}>Test engine</div>
				<div className={"blank"}></div>
				<div className={"settings-box-content"}>
					{testEngine === null && <LoadingDots message="Loading" />}
					{testEngine !== null &&
						<Select.Root value={testEngine} onValueChange={updateTestEngine}>
							<Select.Trigger
								className="flex flex-row justify-between align-items-center devnet-trigger-wrapper w-100">
								<Select.Value>
									<div className="flex flex-column align-items-center m-0">
										<p>{testEngine}</p>
									</div>
								</Select.Value>
								<Select.Icon>
									<BsChevronDown />
								</Select.Icon>
							</Select.Trigger>
							<Select.Portal>
								<Select.Content>
									<Select.Viewport>
										<Select.Item value={"scarb" as TestEngine}>
											<Select.ItemText>Scarb</Select.ItemText>
										</Select.Item>
										<Select.Item value={"forge" as TestEngine}>
											<Select.ItemText>Forge</Select.ItemText>
										</Select.Item>
									</Select.Viewport>
								</Select.Content>
							</Select.Portal>
						</Select.Root>
					}
				</div>
			</div>
		</div>
	);
};
