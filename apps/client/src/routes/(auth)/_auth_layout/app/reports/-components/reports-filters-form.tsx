import {
	CaretDownIcon,
	FunnelIcon,
	MagnifyingGlassIcon,
} from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useEffect } from "react";

import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";
import { Input } from "@verifyafrica/ui/components/ui/input";
import { Label } from "@verifyafrica/ui/components/ui/label";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@verifyafrica/ui/components/ui/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@verifyafrica/ui/components/ui/select";
import { cn } from "@verifyafrica/ui/lib/utils";
import {
	getVerificationTypeFilterLabel,
	REPORTS_VERIFICATION_TYPE_GROUPS,
	type ReportsFiltersFormValues,
	type ReportsListFilterScope,
} from "../-filter-utils";

function VerificationTypeFilterMenu({
	value,
	onChange,
	disabled,
}: {
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
}) {
	const selectedClass = "bg-accent font-medium text-accent-foreground";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild disabled={disabled}>
				<button
					id="verification-type-filter"
					type="button"
					className="flex h-9 w-full items-center justify-between gap-1.5 rounded-md border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 dark:hover:bg-input/50"
				>
					<span className="truncate">{getVerificationTypeFilterLabel(value)}</span>
					<CaretDownIcon className="pointer-events-none size-4 shrink-0 text-muted-foreground" />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="start"
				className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
			>
				<DropdownMenuItem
					className={cn(value === "all" && selectedClass)}
					onSelect={() => onChange("all")}
				>
					All Types
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				{REPORTS_VERIFICATION_TYPE_GROUPS.map((group) => {
					if (group.types.length === 0) {
						return (
							<DropdownMenuItem
								key={group.value}
								className={cn(value === group.value && selectedClass)}
								onSelect={() => onChange(group.value)}
							>
								{group.label}
							</DropdownMenuItem>
						);
					}

					const isGroupActive =
						value === group.value ||
						group.types.some((type) => type.value === value);

					return (
						<DropdownMenuSub key={group.value}>
							<DropdownMenuSubTrigger className={cn(isGroupActive && selectedClass)}>
								{group.label}
							</DropdownMenuSubTrigger>
							<DropdownMenuSubContent className="max-h-80 overflow-y-auto">
								<DropdownMenuItem
									className={cn(
										"font-semibold",
										value === group.value && selectedClass,
									)}
									onSelect={() => onChange(group.value)}
								>
									All {group.label}
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								{group.types.map((type) => (
									<DropdownMenuItem
										key={type.value}
										className={cn(value === type.value && selectedClass)}
										onSelect={() => onChange(type.value)}
									>
										{type.label}
									</DropdownMenuItem>
								))}
							</DropdownMenuSubContent>
						</DropdownMenuSub>
					);
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
import { CountryOptionLabel } from "@verifyafrica/ui/components/ui-extended/country-flag";

type ReportsFiltersFormProps = {
	scope: ReportsListFilterScope;
	values: ReportsFiltersFormValues;
	statuses: string[];
	countries: string[];
	totalCount: number;
	filteredCount: number;
	disabled?: boolean;
	onChange: (values: ReportsFiltersFormValues) => void;
};

export function ReportsFiltersForm({
	scope,
	values,
	statuses,
	countries,
	totalCount: _totalCount,
	filteredCount: _filteredCount,
	disabled = false,
	onChange,
}: ReportsFiltersFormProps) {
	const form = useForm({
		defaultValues: values,
		listeners: {
			onChange: ({ formApi }) => {
				onChange(formApi.state.values);
			},
		},
	});

	useEffect(() => {
		form.reset(values);
	}, [form, values]);

	return (
		<Card className="border bg-muted/30 py-0 shadow-none">
			<CardContent className="flex flex-col gap-4 p-4">
				<div className="flex items-center gap-2">
					<FunnelIcon className="size-5 text-muted-foreground" />
					<p className="font-semibold">Filters</p>
				</div>

				<div
					className={
						scope === "requests"
							? "grid gap-4 md:grid-cols-2 xl:grid-cols-4"
							: "grid gap-4 md:grid-cols-2"
					}
				>
					<form.Field name="search">
						{(field) => (
							<div className="space-y-1.5">
								<Label htmlFor={`reports-search-${scope}`}>Search</Label>
								<div className="relative">
									<MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										id={`reports-search-${scope}`}
										placeholder={
											scope === "requests"
												? "Search by name, ID, or type..."
												: "Search by batch ID..."
										}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
										className="pl-9"
										disabled={disabled}
									/>
								</div>
							</div>
						)}
					</form.Field>
					{scope === "requests" ? (
						<form.Field name="verificationType">
							{(field) => (
								<div className="space-y-1.5">
									<Label htmlFor="verification-type-filter">
										Verification Type
									</Label>
									<VerificationTypeFilterMenu
										value={field.state.value}
										onChange={field.handleChange}
										disabled={disabled}
									/>
								</div>
							)}
						</form.Field>
					) : null}
					<form.Field name="status">
						{(field) => (
							<div className="space-y-1.5">
								<Label htmlFor={`status-filter-${scope}`}>Status</Label>
								<Select
									value={field.state.value}
									onValueChange={field.handleChange}
									disabled={disabled}
								>
									<SelectTrigger
										id={`status-filter-${scope}`}
										className="w-full"
									>
										<SelectValue placeholder="All Statuses" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Statuses</SelectItem>
										{statuses.map((status) => (
											<SelectItem key={status} value={status}>
												{status}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}
					</form.Field>

					{scope === "requests" ? (
						<form.Field name="country">
							{(field) => (
								<div className="space-y-1.5">
									<Label htmlFor="country-filter">Country</Label>
									<Select
										value={field.state.value}
										onValueChange={field.handleChange}
										disabled={disabled}
									>
										<SelectTrigger id="country-filter" className="w-full">
											<SelectValue placeholder="All Countries" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All Countries</SelectItem>
											{countries.map((country) => (
												<SelectItem key={country} value={country}>
													<CountryOptionLabel name={country} />
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							)}
						</form.Field>
					) : null}
				</div>
			</CardContent>
		</Card>
	);
}
