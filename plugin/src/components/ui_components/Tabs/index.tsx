import React from "react";
import * as Tabs from "@radix-ui/react-tabs";
import "./tabs.css";

interface IReactFC {
	children: React.ReactNode;
}

const Root: React.FC<IReactFC & Tabs.TabsProps> = ({ children, ...props }) => (
	<Tabs.Root className="TabsRoot" {...props}>
		{children}
	</Tabs.Root>
);

const List: React.FC<IReactFC & Tabs.TabsListProps> = ({ children, ...props }) => (
	<Tabs.List className="TabsList" {...props}>
		{children}
	</Tabs.List>
);

const Trigger: React.FC<IReactFC & Tabs.TabsTriggerProps> = ({ children, ...props }) => (
	<Tabs.Trigger className="TabsTrigger" {...props}>
		{children}
	</Tabs.Trigger>
);
const Content: React.FC<IReactFC & Tabs.TabsContentProps> = ({ children, ...props }) => (
	<Tabs.Content className="TabsContent" {...props}>
		{children}
	</Tabs.Content>
);

export { Root, Content, Trigger, List };
