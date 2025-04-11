interface IExplorerSelector {
	path?: string;
	text?: string;
	title?: string;
	isInline?: boolean;
	isNetworkVisible?: boolean;
	isTextVisible?: boolean;
	controlHook: IUseCurrentExplorer;
}

interface IUseCurrentExplorer {
	explorer: "voyager" | "starkscan";
	setExplorer: React.Dispatch<React.SetStateAction<"voyager" | "starkscan">>;
}

export { type IExplorerSelector, type IUseCurrentExplorer };