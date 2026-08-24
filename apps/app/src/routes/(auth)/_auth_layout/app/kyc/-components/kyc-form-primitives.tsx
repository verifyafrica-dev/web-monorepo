import {
	CalendarBlankIcon,
	CloudArrowUpIcon,
	XIcon,
} from "@phosphor-icons/react";
import { format, isValid, parse, startOfDay } from "date-fns";
import { useMemo, useState } from "react";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Calendar } from "@verifyafrica/ui/components/ui/calendar";
import {
	FileUpload,
	FileUploadDropzone,
	FileUploadItem,
	FileUploadItemDelete,
	FileUploadItemMetadata,
	FileUploadItemPreview,
	FileUploadList,
	FileUploadTrigger,
} from "@verifyafrica/ui/components/ui/file-upload";
import { Input } from "@verifyafrica/ui/components/ui/input";
import { Label } from "@verifyafrica/ui/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@verifyafrica/ui/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@verifyafrica/ui/components/ui/select";
import { Separator } from "@verifyafrica/ui/components/ui/separator";
import { Textarea } from "@verifyafrica/ui/components/ui/textarea";
import { getCountryCode, getCountrySelectOptions } from "@verifyafrica/ui/lib/country-state-city";
import { CountryOptionLabel } from "@verifyafrica/ui/components/ui-extended/country-flag";
import { cn } from "@verifyafrica/ui/lib/utils";

export function KycSectionHeader({
	title,
	description,
	badge,
}: {
	title: string;
	description: string;
	badge?: React.ReactNode;
}) {
	return (
		<div className="space-y-1">
			<div className="flex flex-wrap items-center gap-3">
				<h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
				{badge}
			</div>
			<p className="text-sm text-muted-foreground">{description}</p>
		</div>
	);
}

export function KycFormField({
	id,
	label,
	required,
	children,
	className,
	description,
}: {
	id?: string;
	label: string;
	required?: boolean;
	children: React.ReactNode;
	className?: string;
	description?: string;
}) {
	return (
		<div className={cn("flex flex-col gap-1.5", className)}>
			<Label htmlFor={id}>
				{label}
				{required && <span className="text-destructive"> *</span>}
			</Label>
			{children}
			{description && (
				<p className="text-xs text-muted-foreground">{description}</p>
			)}
		</div>
	);
}

export function KycFormGrid({ children }: { children: React.ReactNode }) {
	return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

export function KycFormSeparator() {
	return <Separator />;
}

export function KycSaveButton({
	label = "Save Changes",
	className,
	disabled,
	isSaving,
}: {
	label?: string;
	className?: string;
	disabled?: boolean;
	isSaving?: boolean;
}) {
	return (
		<Button
			type="submit"
			className={cn("cursor-pointer tracking-wide", className)}
			disabled={disabled || isSaving}
		>
			{isSaving ? "Saving..." : label}
		</Button>
	);
}

export function CountrySelect({
	id,
	value,
	onValueChange,
	placeholder = "Select country",
	disabled,
}: {
	id?: string;
	value?: string;
	onValueChange?: (value: string) => void;
	placeholder?: string;
	disabled?: boolean;
}) {
	const countryOptions = useMemo(() => getCountrySelectOptions(), []);
	const countryCode = getCountryCode(value);

	return (
		<Select
			value={countryCode || undefined}
			onValueChange={onValueChange}
			disabled={disabled}
		>
			<SelectTrigger
				id={id}
				className="w-full"
			>
				<SelectValue placeholder={placeholder} />
			</SelectTrigger>
			<SelectContent className="max-h-60">
				{countryOptions.map((country) => (
					<SelectItem
						key={country.value}
						value={country.value}
					>
						<CountryOptionLabel
							name={country.name}
							countryCode={country.isoCode}
						/>
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

function parseKycDateValue(value?: string | Date) {
	if (!value) {
		return undefined;
	}

	if (value instanceof Date) {
		return isValid(value) ? value : undefined;
	}

	const parsed = parse(value, "yyyy-MM-dd", new Date());
	return isValid(parsed) ? parsed : undefined;
}

export function KycDatePicker({
	id,
	value,
	onChange,
	placeholder = "dd/mm/yyyy",
	disabled,
	disablePastDates,
	disableFutureDates,
}: {
	id?: string;
	value?: string | Date;
	onChange?: (date: Date | undefined) => void;
	placeholder?: string;
	disabled?: boolean;
	disablePastDates?: boolean;
	disableFutureDates?: boolean;
}) {
	const [open, setOpen] = useState(false);
	const selectedDate = parseKycDateValue(value);
	const disabledPastDays = disablePastDates
		? [{ before: startOfDay(new Date()) }]
		: undefined;

	const disabledFutureDays = disableFutureDates
		? [{ after: startOfDay(new Date()) }]
		: undefined;
	return (
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
					{selectedDate ? format(selectedDate, "dd/MM/yyyy") : placeholder}
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
					disabled={disabledPastDays || disabledFutureDays}
					onSelect={(date) => {
						onChange?.(date);
						setOpen(false);
					}}
					captionLayout="dropdown"
				/>
			</PopoverContent>
		</Popover>
	);
}

export function KycFileUpload({
	value,
	onValueChange,
	onUpload,
	onFileReject,
	onFileValidate,
	accept = "image/*,application/pdf",
	maxSize = 10 * 1024 * 1024,
	multiple = true,
	disabled,
}: {
	value?: File[];
	onValueChange?: (files: File[]) => void;
	onUpload?: (
		files: File[],
		options: {
			onProgress: (file: File, progress: number) => void;
			onSuccess: (file: File) => void;
			onError: (file: File, error: Error) => void;
		},
	) => Promise<void> | void;
	onFileReject?: (file: File, message: string) => void;
	onFileValidate?: (file: File) => string | null | undefined;
	accept?: string;
	maxSize?: number;
	multiple?: boolean;
	disabled?: boolean;
}) {
	return (
		<FileUpload
			value={value}
			onValueChange={onValueChange}
			onUpload={onUpload}
			onFileReject={onFileReject}
			onFileValidate={onFileValidate}
			accept={accept}
			maxSize={maxSize}
			multiple={multiple}
			disabled={disabled}
		>
			<FileUploadDropzone className="flex min-h-32 flex-col items-center justify-center gap-2 border-dashed py-8">
				<CloudArrowUpIcon className="size-8 text-muted-foreground" />
				<FileUploadTrigger asChild>
					<Button
						variant="link"
						className="h-auto p-0 text-xs font-semibold tracking-wide uppercase"
					>
						Click to upload or drag and drop
					</Button>
				</FileUploadTrigger>
			</FileUploadDropzone>
			{(value?.length ?? 0) > 0 && (
				<FileUploadList className="mt-3">
					{value?.map((file) => (
						<FileUploadItem
							key={`${file.name}-${file.lastModified}`}
							value={file}
							className="p-2"
						>
							<FileUploadItemPreview className="size-8" />
							<FileUploadItemMetadata size="sm" />
							<FileUploadItemDelete asChild>
								<Button
									variant="ghost"
									size="icon"
									className="size-6"
								>
									<XIcon className="size-3" />
								</Button>
							</FileUploadItemDelete>
						</FileUploadItem>
					))}
				</FileUploadList>
			)}
		</FileUpload>
	);
}

export function KycEntryCard({
	title,
	onRemove,
	children,
}: {
	title: string;
	onRemove?: () => void;
	children: React.ReactNode;
}) {
	return (
		<div className="relative space-y-4 rounded-lg border bg-card p-4 sm:p-5">
			<div className="flex items-center justify-between">
				<p className="text-sm font-semibold">{title}</p>
				{onRemove && (
					<Button
						type="button"
						variant="ghost"
						size="icon-xs"
						onClick={onRemove}
						aria-label={`Remove ${title}`}
					>
						<XIcon className="size-4" />
					</Button>
				)}
			</div>
			{children}
		</div>
	);
}

export { Input, Textarea };
