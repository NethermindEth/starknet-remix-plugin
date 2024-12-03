import React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { BsChevronDown } from "react-icons/bs";
import "./accordian.css";

export interface IFCProps {
	children: React.ReactNode | null;
}

// eslint-disable-next-line react/display-name
export const AccordionTrigger = React.forwardRef<any, any>(
	({ children, className, ...props }, forwardedRef) => (
		<AccordionPrimitive.Header className="AccordionHeader">
			<AccordionPrimitive.Trigger
				className={"AccordionTrigger"}
				{...props}
				ref={forwardedRef}
			>
				{children}
				<BsChevronDown className="AccordionChevron light" aria-hidden />
			</AccordionPrimitive.Trigger>
		</AccordionPrimitive.Header>
	)
);

// eslint-disable-next-line react/display-name
export const AccordionContent = React.forwardRef<any, any>(
	({ children, className, ...props }, forwardedRef) => (
		<AccordionPrimitive.Content className={"AccordionContent"} {...props} ref={forwardedRef}>
			<div className="AccordionContentText">{children}</div>
		</AccordionPrimitive.Content>
	)
);

export const AccordianItem = AccordionPrimitive.Item;

interface IAccordian {
	type: "single" | "multiple";
	defaultValue: any;
	value?: any;
	children: React.ReactNode;
	className?: string;
}
const Accordian: React.FC<IAccordian> = ({
	type = "single",
	children,
	defaultValue,
	value,
	className
}) => (
	<AccordionPrimitive.Root
		className={className ?? "AccordionRoot"}
		type={type}
		value={value}
		defaultValue={defaultValue}
		collapsible={type === "single"}
	>
		{children}
	</AccordionPrimitive.Root>
);

export default Accordian;
