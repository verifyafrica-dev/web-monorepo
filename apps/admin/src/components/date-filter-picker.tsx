import { CalendarBlankIcon } from "@phosphor-icons/react";
import { format, isValid, parse, startOfDay } from "date-fns";
import { useState } from "react";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Calendar } from "@verifyafrica/ui/components/ui/calendar";
import { Label } from "@verifyafrica/ui/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@verifyafrica/ui/components/ui/popover";
import { cn } from "#/lib/utils";

function parseFilterDate(value: string) {
	if (!value) {
		return undefined;
	}

	const parsed = parse(value, "yyyy-MM-dd", new Date());
	return isValid(parsed) ? parsed : undefined;
}

export function DateFilterPicker({
	id,
	label,
	value,
	onChange,
	disabled,
	min,
	max,
	placeholder = "Pick a date",
}: {
	id: string;
	label: string;
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
	min?: string;
	max?: string;
	placeholder?: string;
}) {
	const [open, setOpen] = useState(false);
	const selectedDate = parseFilterDate(value);
	const minDate = min ? parseFilterDate(min) : undefined;
	const maxDate = max ? parseFilterDate(max) : undefined;

	return (
		<div className="space-y-1">
			<Label
				htmlFor={id}
				className="text-xs text-muted-foreground"
			>
				{label}
			</Label>
			<Popover
				open={open}
				onOpenChange={setOpen}
			>
				<PopoverTrigger asChild>
					<Button
						id={id}
						type="button"
						variant="outline"
						disabled={disabled}
						className={cn(
							"w-full justify-between font-normal",
							!selectedDate && "text-muted-foreground",
						)}
					>
						{selectedDate
							? format(selectedDate, "MMM d, yyyy")
							: placeholder}
						<CalendarBlankIcon className="size-4" />
					</Button>
				</PopoverTrigger>
				<PopoverContent
					className="w-auto p-0"
					align="start"
				>
					<Calendar
						mode="single"
						selected={selectedDate}
						defaultMonth={selectedDate ?? minDate ?? maxDate}
						captionLayout="dropdown"
						disabled={(date) => {
							const day = startOfDay(date);

							if (minDate && day < startOfDay(minDate)) {
								return true;
							}

							if (maxDate && day > startOfDay(maxDate)) {
								return true;
							}

							return false;
						}}
						onSelect={(date) => {
							onChange(date ? format(date, "yyyy-MM-dd") : "");
							setOpen(false);
						}}
					/>
				</PopoverContent>
			</Popover>
		</div>
	);
}
