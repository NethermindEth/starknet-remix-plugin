// Your intermediary file with types
import * as SelectPrimitive from "@radix-ui/react-select";
import "./styles.css";
import React from "react";

interface CommonProps {
	className?: string;
	children: React.ReactNode;
}

interface CreatableSelectProps extends Omit<SelectPrimitive.SelectProps, keyof CommonProps>, CommonProps {
	onCreateOption: (value: string) => void;
	createPlaceholder?: string;
}

export const Root = SelectPrimitive.Root;

export const Trigger: React.FC<CommonProps> = ({
	children,
	className,
	...props
}) => (
	<SelectPrimitive.Trigger className={`SelectTrigger flex flex-row justify-content-space-between align-items-center p-2 br-1 devnet-trigger-wrapper ${className ?? ""}`} {...props}>
		{children}
	</SelectPrimitive.Trigger>
);

export const Content: React.FC<CommonProps> = ({
	children,
	className,
	...props
}) => (
	<SelectPrimitive.Content
		className={`SelectContent ${className ?? ""}`}
		position="popper"
		sideOffset={5}
		{...props}
	>
		{children}
	</SelectPrimitive.Content>
);

export const Item: React.FC<SelectPrimitive.SelectItemProps & CommonProps> = ({
	children,
	className,
	...props
}) => (
	<SelectPrimitive.Item
		className={`SelectItem ${className ?? ""}`}
		{...props}
	>
		{children}
	</SelectPrimitive.Item>
);

export const Value = SelectPrimitive.Value;

export const Icon: React.FC<{
	children: React.ReactElement;
	className?: string;
}> = ({
	children,
	className,
	...props
}) => (
	<SelectPrimitive.Icon className={`SelectIcon ${className ?? ""}`} {...props}>
		{children}
	</SelectPrimitive.Icon>
);

export const Portal = SelectPrimitive.Portal;

export const Viewport: React.FC<CommonProps> = ({
	children,
	className,
	...props
}) => (
	<SelectPrimitive.Viewport className={`SelectViewport ${className ?? ""}`} {...props}>
		{children}
	</SelectPrimitive.Viewport>
);

export const ItemText: React.FC<CommonProps> = ({
	children,
	className,
	...props
}) => (
	<SelectPrimitive.ItemText className={`SelectItemText ${className ?? ""}`} {...props}>
		{children}
	</SelectPrimitive.ItemText>
);

export const CreatableSelect: React.FC<CreatableSelectProps> = ({
	children,
	onCreateOption,
	createPlaceholder = "Type to add...",
	...props
}): JSX.Element => {
	const [inputValue, setInputValue] = React.useState<string>("");
	const [isCreating, setIsCreating] = React.useState<boolean>(false);

	const handleKeyDown = (event: React.KeyboardEvent): void => {
		if (event.key === "Enter" && inputValue !== "") {
			event.preventDefault();
			onCreateOption(inputValue);
			setInputValue("");
			setIsCreating(false);
		}
	};

	return (
		<div className="creatable-select-wrapper">
			{!isCreating
				? (
					<Root {...props}>
						{children}
						<Item
							value="__create__"
							onSelect={(): void => {
								setIsCreating(true);
							}}
						>
							<ItemText>+ Add new option</ItemText>
						</Item>
					</Root>
				)
				: (
					<input
						className="creatable-select-input"
						value={inputValue}
						onChange={(e): void => {
							setInputValue(e.target.value);
						}}
						onKeyDown={handleKeyDown}
						placeholder={createPlaceholder}
						autoFocus
						onBlur={(): void => {
							setIsCreating(false);
						}}
					/>
				)
			}
		</div>
	);
};
