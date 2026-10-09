import type { GovernmentRegistryChecksVerificationRequestDetail } from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@verifyafrica/ui/components/ui/table";

import { asNonEmptyString, asRecord } from "../../-utils";
import { ReportDetailField } from "../report-detail-field";
import {
	formatReportValue,
	MatchBadge,
	ReportDataMatches,
	ReportFieldGrid,
	ReportSectionCard,
} from "../report-sections";
import { ProofImagePreviewDialog } from "../verification-proofs/proof-image-preview-dialog";
import {
	buildRegistrySections,
	type RegistryMatch,
	type RegistryTable,
} from "./government-registry-checks-sections";

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
										{formatReportValue(row[column.key], column.format)}
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
				<ReportSectionCard title={sections.personalTitle}>
					<ReportFieldGrid fields={sections.personal} />
					<ReportDataMatches matches={sections.dataMatches} />
				</ReportSectionCard>
			) : null}

			{hasImages ? (
				<ReportSectionCard title="Images">
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
				</ReportSectionCard>
			) : null}

			{sections.document.length > 0 ? (
				<ReportSectionCard title="Document Details">
					<ReportFieldGrid fields={sections.document} />
				</ReportSectionCard>
			) : null}

			{sections.contact.length > 0 ? (
				<ReportSectionCard title="Contact & Location">
					<ReportFieldGrid fields={sections.contact} />
				</ReportSectionCard>
			) : null}

			{hasAdditional ? (
				<ReportSectionCard title="Additional Details">
					<ReportFieldGrid fields={sections.additional} />
					{sections.tables.map((table) => (
						<RegistryDataTable key={table.key} table={table} />
					))}
				</ReportSectionCard>
			) : null}
		</div>
	);
}
