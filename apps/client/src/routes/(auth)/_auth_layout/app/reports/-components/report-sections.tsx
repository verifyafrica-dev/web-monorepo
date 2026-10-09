import { Badge } from "@verifyafrica/ui/components/ui/badge";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@verifyafrica/ui/components/ui/card";
import { cn } from "@verifyafrica/ui/lib/utils";
import { format, isValid, parseISO } from "date-fns";
import type { ReactNode } from "react";

import { displayValue, formatHumanLabel, formatYesNo } from "../-utils";
import { ReportDetailField } from "./report-detail-field";

export type ReportFieldFormat =
	| "text"
	| "date"
	| "datetime"
	| "title"
	| "yesNo";

export type ReportField = {
	key: string;
	label: string;
	value: unknown;
	format?: ReportFieldFormat;
	mono?: boolean;
	wide?: boolean;
	multiline?: boolean;
};

export type ReportMatch = {
	key: string;
	label: string;
	submitted: unknown;
	match: boolean;
	confidence?: number;
};

export function isEmptyReportValue(value: unknown) {
	if (value === null || value === undefined) return true;
	if (typeof value === "string") return value.trim().length === 0;
	if (Array.isArray(value)) return value.length === 0;
	return false;
}

function formatDate(value: string, pattern: string) {
	const parsed = parseISO(value);
	return isValid(parsed) ? format(parsed, pattern) : value;
}

export function formatReportValue(
	value: unknown,
	valueFormat: ReportFieldFormat = "text",
): string {
	if (isEmptyReportValue(value)) return "N/A";
	if (Array.isArray(value)) {
		return value.map((item) => formatReportValue(item, valueFormat)).join(", ");
	}

	switch (valueFormat) {
		case "date":
			return typeof value === "string"
				? formatDate(value, "d MMM yyyy")
				: displayValue(value);
		case "datetime":
			return typeof value === "string"
				? formatDate(value, "d MMM yyyy, h:mm a")
				: displayValue(value);
		case "title":
			return typeof value === "string"
				? formatHumanLabel(value)
				: displayValue(value);
		case "yesNo":
			return (
				formatYesNo(value) ??
				(typeof value === "string"
					? formatHumanLabel(value)
					: displayValue(value))
			);
		default:
			return displayValue(value);
	}
}

export function ReportSectionCard({
	id,
	title,
	children,
}: {
	id?: string;
	title: string;
	children: ReactNode;
}) {
	return (
		<Card id={id} className={cn(id && "scroll-mt-6")}>
			<CardHeader className="pb-3">
				<CardTitle className="text-base font-semibold">{title}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">{children}</CardContent>
		</Card>
	);
}

export function ReportFieldGrid({ fields }: { fields: ReportField[] }) {
	if (fields.length === 0) return null;

	return (
		<div className="grid gap-4 sm:grid-cols-2">
			{fields.map((entry) => (
				<ReportDetailField
					key={entry.key}
					label={entry.label}
					value={formatReportValue(entry.value, entry.format)}
					mono={entry.mono}
					className={cn(entry.wide && "sm:col-span-2")}
					valueClassName={cn(entry.multiline && "whitespace-pre-wrap")}
				/>
			))}
		</div>
	);
}

export function MatchBadge({ match }: { match: boolean }) {
	return (
		<Badge
			variant="outline"
			className={cn(
				match
					? "border-emerald-200 bg-emerald-500 text-white"
					: "border-red-200 bg-red-500 text-white",
			)}
		>
			{match ? "Match" : "No match"}
		</Badge>
	);
}

export function ReportDataMatches({ matches }: { matches: ReportMatch[] }) {
	if (matches.length === 0) return null;

	return (
		<div className="space-y-3 border-t pt-4">
			<p className="text-sm font-medium">Submitted Data Match</p>
			<div className="grid gap-4 sm:grid-cols-2">
				{matches.map((entry) => (
					<ReportDetailField
						key={entry.key}
						label={entry.label}
						value={
							<div className="flex flex-wrap items-center gap-2">
								<span>{formatReportValue(entry.submitted)}</span>
								<MatchBadge match={entry.match} />
							</div>
						}
					/>
				))}
			</div>
		</div>
	);
}
