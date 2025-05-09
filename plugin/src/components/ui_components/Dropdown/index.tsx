import React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";

import "./styles.css";

const Root = DropdownMenuPrimitive.Root;

interface ITrigger {
	icon?: React.ReactNode;
	children?: React.ReactNode;
}

const Trigger: React.FC<ITrigger> = ({
	children,
	...props
}) => (
	<DropdownMenuPrimitive.Trigger asChild {...props}>
		{children}
	</DropdownMenuPrimitive.Trigger>
);

const Portal = DropdownMenuPrimitive.Portal;

interface IContent {
	children?: React.ReactNode;
}

const Content: React.FC<IContent> = ({
	children,
	...props
}) => (
	<DropdownMenuPrimitive.Content className="DropdownMenuContent bg-primary" {...props}>
		{children}
	</DropdownMenuPrimitive.Content>
);

interface IItem {
	children: React.ReactNode;
}

const Item: React.FC<IItem & DropdownMenuPrimitive.DropdownMenuItemProps> = ({
	children,
	...props
}) => (
	<DropdownMenuPrimitive.Item className="DropdownMenuItem bg-primary" {...props}>
		{children}
	</DropdownMenuPrimitive.Item>
);

export {
	Root,
	Item,
	Portal,
	Content,
	Trigger
};
