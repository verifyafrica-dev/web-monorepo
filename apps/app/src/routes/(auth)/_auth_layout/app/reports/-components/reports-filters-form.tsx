import { FunnelIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useEffect } from "react";

import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";
import { Input } from "@verifyafrica/ui/components/ui/input";
import { Label } from "@verifyafrica/ui/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@verifyafrica/ui/components/ui/select";
import {
	formatVerificationTypeLabel,
	type ReportsFiltersFormValues,
	type ReportsListFilterScope,
} from "../-filter-utils";
import { CountryOptionLabel } from "@verifyafrica/ui/components/ui-extended/country-flag";

type ReportsFiltersFormProps = {
	scope: ReportsListFilterScope;
	values: ReportsFiltersFormValues;
	verificationTypes: string[];
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
	verificationTypes,
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
												? "Search by name or ID..."
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
									<Select
										value={field.state.value}
										onValueChange={field.handleChange}
										disabled={disabled}
									>
										<SelectTrigger
											id="verification-type-filter"
											className="w-full"
										>
											<SelectValue placeholder="All Types" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All Types</SelectItem>
											{verificationTypes.map((type) => (
												<SelectItem key={type} value={type}>
													{formatVerificationTypeLabel(type)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
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
