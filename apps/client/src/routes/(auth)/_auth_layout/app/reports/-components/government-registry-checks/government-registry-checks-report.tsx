import type { GovernmentRegistryChecksVerificationRequestDetail } from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@verifyafrica/ui/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@verifyafrica/ui/components/ui/table";
import { cn } from "@verifyafrica/ui/lib/utils";
import { format, isValid, parseISO } from "date-fns";
import type { ReactNode } from "react";

import {
	asNonEmptyString,
	asRecord,
	displayValue,
	formatHumanLabel,
	formatYesNo,
} from "../../-utils";
import { ReportDetailField } from "../report-detail-field";
import { ProofImagePreviewDialog } from "../verification-proofs/proof-image-preview-dialog";
import {
	buildRegistrySections,
	isEmptyRegistryValue,
	type RegistryField,
	type RegistryFieldFormat,
	type RegistryMatch,
	type RegistryTable,
} from "./government-registry-checks-sections";

function formatDate(value: string, pattern: string) {
	const parsed = parseISO(value);
	return isValid(parsed) ? format(parsed, pattern) : value;
}

function formatRegistryValue(
	value: unknown,
	valueFormat: RegistryFieldFormat = "text",
): string {
	if (isEmptyRegistryValue(value)) return "N/A";
	if (Array.isArray(value)) {
		return value
			.map((item) => formatRegistryValue(item, valueFormat))
			.join(", ");
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

function SectionCard({
	title,
	children,
}: {
	title: string;
	children: ReactNode;
}) {
	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="text-base font-semibold">{title}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">{children}</CardContent>
		</Card>
	);
}

function FieldGrid({ fields }: { fields: RegistryField[] }) {
	if (fields.length === 0) return null;

	return (
		<div className="grid gap-4 sm:grid-cols-2">
			{fields.map((entry) => (
				<ReportDetailField
					key={entry.key}
					label={entry.label}
					value={formatRegistryValue(entry.value, entry.format)}
					mono={entry.mono}
					className={cn(entry.wide && "sm:col-span-2")}
				/>
			))}
		</div>
	);
}

function MatchBadge({ match }: { match: boolean }) {
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

function DataMatches({ matches }: { matches: RegistryMatch[] }) {
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
								<span>{formatRegistryValue(entry.submitted)}</span>
								<MatchBadge match={entry.match} />
							</div>
						}
					/>
				))}
			</div>
		</div>
	);
}

function FaceMatch({ match }: { match: RegistryMatch }) {
	return (
		<ReportDetailField
			label={match.label}
			value={
				<div className="flex flex-wrap items-center gap-2">
					<MatchBadge match={match.match} />
					{match.confidence !== undefined ? (
						<span className="text-muted-foreground">
							{match.confidence}% confidence
						</span>
					) : null}
				</div>
			}
		/>
	);
}

function RegistryDataTable({ table }: { table: RegistryTable }) {
	return (
		<div className="space-y-3">
			<p className="text-sm font-medium">
				{table.title}{" "}
				<span className="text-muted-foreground">({table.rows.length})</span>
			</p>
			<div className="overflow-x-auto rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							{table.columns.map((column) => (
								<TableHead key={column.key}>{column.label}</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{table.rows.map((row, index) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: registry rows have no stable id
							<TableRow key={index}>
								{table.columns.map((column) => (
									<TableCell key={column.key} className="whitespace-nowrap">
										{formatRegistryValue(row[column.key], column.format)}
									</TableCell>
								))}
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}

export function GovernmentRegistryChecksReport({
	verification,
}: {
	verification: GovernmentRegistryChecksVerificationRequestDetail;
}) {
	const responseData = asRecord(verification.response_data) ?? {};
	// Korapay shape: { status, message, data: { first_name, ... } }
	const sourceData = asRecord(responseData.data) ?? responseData;
	const isFailed =
		verification.status === "FAILED" || verification.status === "ERROR";

	const sections = buildRegistrySections(
		verification.verification_type,
		sourceData,
		{
			inputData: asRecord(verification.input_data),
			failureMessage: isFailed
				? asNonEmptyString(responseData.message)
				: undefined,
		},
	);

	const hasPersonal =
		sections.personal.length > 0 || sections.dataMatches.length > 0;
	const hasImages = sections.images.length > 0 || sections.faceMatch !== null;
	const hasAdditional =
		sections.additional.length > 0 || sections.tables.length > 0;

	return (
		<div className="space-y-6">
			{hasPersonal ? (
				<SectionCard title={sections.personalTitle}>
					<FieldGrid fields={sections.personal} />
					<DataMatches matches={sections.dataMatches} />
				</SectionCard>
			) : null}

			{hasImages ? (
				<SectionCard title="Images">
					{sections.images.length > 0 ? (
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{sections.images.map((image) => (
								<ReportDetailField
									key={image.key}
									label={image.label}
									value={
										<ProofImagePreviewDialog
											src={image.src}
											alt={image.label}
											label={image.label}
											thumbnailClassName="max-h-40 rounded-md border object-cover"
										/>
									}
								/>
							))}
						</div>
					) : null}
					{sections.faceMatch ? <FaceMatch match={sections.faceMatch} /> : null}
				</SectionCard>
			) : null}

			{sections.document.length > 0 ? (
				<SectionCard title="Document Details">
					<FieldGrid fields={sections.document} />
				</SectionCard>
			) : null}

			{sections.contact.length > 0 ? (
				<SectionCard title="Contact & Location">
					<FieldGrid fields={sections.contact} />
				</SectionCard>
			) : null}

			{hasAdditional ? (
				<SectionCard title="Additional Details">
					<FieldGrid fields={sections.additional} />
					{sections.tables.map((table) => (
						<RegistryDataTable key={table.key} table={table} />
					))}
				</SectionCard>
			) : null}
		</div>
	);
}
