// Your intermediary file with types
import * as SelectPrimitive from "@radix-ui/react-select";
import "./select.css";
import React from "react";

interface CommonProps {
	className?: string;
	children: React.ReactNode;
}

export const Root = SelectPrimitive.Root;

export const Trigger: React.FC<CommonProps> = ({ children, className, ...props }) => (
	<SelectPrimitive.Trigger asChild {...props}>
		<button className={`SelectTrigger ${className ?? ""}`}>{children}</button>
	</SelectPrimitive.Trigger>
);

export const Content: React.FC<CommonProps> = ({ children, className, ...props }) => (
	<SelectPrimitive.Content asChild {...props}>
		<div className={`SelectContent ${className ?? ""}`}>{children}</div>
	</SelectPrimitive.Content>
);

export const Item: React.FC<SelectPrimitive.SelectItemProps & CommonProps> = ({
	children,
	className,
	...props
}) => (
	<SelectPrimitive.Item asChild {...props}>
		<div className={`SelectItem ${className ?? ""}`}>{children}</div>
	</SelectPrimitive.Item>
);

export const Value = SelectPrimitive.Value;

export const Icon: React.FC<{
	children: React.ReactElement;
	className?: string;
}> = ({ children, className, ...props }) => (
	<SelectPrimitive.Icon {...props} className={`SelectIcon ${className ?? ""}`}>
		{children}
	</SelectPrimitive.Icon>
);

export const Portal = SelectPrimitive.Portal;

export const Viewport: React.FC<CommonProps> = ({ children, className, ...props }) => (
	<SelectPrimitive.Viewport {...props} className={`SelectViewport ${className ?? ""}`}>
		{children}
	</SelectPrimitive.Viewport>
);

export const ItemText: React.FC<CommonProps> = ({ children, className, ...props }) => (
	<SelectPrimitive.ItemText {...props} className={`SelectItemText ${className ?? ""}`}>
		{children}
	</SelectPrimitive.ItemText>
);
