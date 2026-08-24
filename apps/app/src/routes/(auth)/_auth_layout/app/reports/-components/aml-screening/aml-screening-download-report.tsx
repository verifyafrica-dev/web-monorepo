import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@verifyafrica/ui/components/ui/card";
import { cn } from "#/lib/utils.ts";
import { isPlainObject } from "#/lib/validators";
import type {
	AmlScreeningResponsePayload,
	AmlScreeningVerificationRequestDetail,
} from "#/api/http/v2/verifications/verifications.types";
import { asNonEmptyString, asRecord } from "../../-utils";
import { ReportOverviewCard } from "../report-overview-card";
import { ReportDetailField } from "../report-detail-field";

type AmlHit = Record<string, unknown>;

function getHitRenderKey(hit: AmlHit) {
	const name = String(hit.name ?? "unnamed-hit").trim();
	const score = String(hit.score ?? "na");
	const fields = JSON.stringify(hit.fields ?? {});
	return `${name}-${score}-${fields}`;
}

function asArray(value: unknown): unknown[] {
	if (Array.isArray(value)) {
		return value;
	}

	if (value === null || value === undefined || value === "") {
		return [];
	}

	return [value];
}

function toDisplayValue(value: unknown) {
	if (value === null || value === undefined || value === "") {
		return "N/A";
	}

	if (typeof value === "boolean") {
		return value ? "Yes" : "No";
	}

	return String(value);
}

function formatLabel(value: string) {
	return value
		.replace(/_/g, " ")
		.replace(/-/g, " ")
		.replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeTextList(value: unknown): string[] {
	return Array.from(
		new Set(
			asArray(value)
				.map((item) => String(item ?? "").trim())
				.filter(Boolean),
		),
	);
}

function normalizeScore(value: unknown) {
	if (typeof value !== "number" || Number.isNaN(value)) {
		return 0;
	}

	if (value > 1) {
		return Math.max(0, Math.min(1, value / 100));
	}

	return Math.max(0, Math.min(1, value));
}

function getRiskLevel(score: number): "high" | "medium" | "low" {
	if (score >= 0.95) {
		return "high";
	}

	if (score >= 0.85) {
		return "medium";
	}

	return "low";
}

function getRiskClassName(level: "high" | "medium" | "low") {
	if (level === "high") {
		return "text-red-700";
	}

	if (level === "medium") {
		return "text-amber-700";
	}

	return "text-lime-700";
}

function getFieldItems(
	fields: Record<string, unknown>,
	key: string,
): Array<{ value: string; source?: string }> {
	return asArray(fields[key]).flatMap((item) => {
		const objectItem = asRecord(item);
		if (objectItem) {
			const value = String(objectItem.value ?? "").trim();
			if (!value) {
				return [];
			}

			const source =
				typeof objectItem.source === "string" && objectItem.source.trim()
					? objectItem.source
					: undefined;

			return [{ value, source }];
		}

		const value = String(item ?? "").trim();
		return value ? [{ value }] : [];
	});
}

function getAssociates(hit: AmlHit): string[] {
	const directAssociates = asArray(hit.associates).flatMap((item) => {
		const objectItem = asRecord(item);
		if (!objectItem) {
			return [];
		}

		const name = String(objectItem.name ?? "").trim();
		return name ? [name] : [];
	});

	if (directAssociates.length > 0) {
		return Array.from(new Set(directAssociates));
	}

	return asArray(hit.source_details).flatMap((sourceDetail) => {
		const sourceDetailRecord = asRecord(sourceDetail);
		const data = asRecord(sourceDetailRecord?.data);
		return asArray(data?.linked_entities).flatMap((entity) => {
			const entityRecord = asRecord(entity);
			return normalizeTextList(entityRecord?.name);
		});
	});
}

function HitDownloadCard({ hit, index }: { hit: AmlHit; index: number }) {
	const fields = asRecord(hit.fields) ?? {};
	const aliases = normalizeTextList(hit.alternative_names);
	const associates = getAssociates(hit);
	const matchTypes = normalizeTextList(hit.match_types);
	const score = normalizeScore(hit.score);
	const level = getRiskLevel(score);

	const fieldEntries = Object.entries(fields).filter(([, value]) => {
		const items = asArray(value).flatMap((item) => {
			const objectItem = asRecord(item);
			if (objectItem) {
				return String(objectItem.value ?? "").trim() ? [item] : [];
			}

			return String(item ?? "").trim() ? [item] : [];
		});

		return items.length > 0;
	});

	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="text-sm font-semibold">
					Hit #{index + 1}: {String(hit.name ?? "Unnamed Hit")}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid gap-4 sm:grid-cols-2">
					<ReportDetailField
						label="Risk Level"
						value={
							<span
								className={cn(
									"font-semibold capitalize",
									getRiskClassName(level),
								)}
							>
								{level}
							</span>
						}
					/>
					<ReportDetailField
						label="Score"
						value={`${Math.round(score * 100)}%`}
					/>
					<ReportDetailField
						label="Match Types"
						className="sm:col-span-2"
						value={
							matchTypes.length > 0 ? (
								<div className="flex flex-wrap gap-1">
									{matchTypes.map((type) => (
										<Badge
											key={type}
											variant="outline"
										>
											{formatLabel(type)}
										</Badge>
									))}
								</div>
							) : (
								"N/A"
							)
						}
					/>
				</div>

				<div className="grid gap-4 sm:grid-cols-2">
					<ReportDetailField
						label="Aliases"
						className="sm:col-span-2"
						value={aliases.length > 0 ? aliases.join(", ") : "N/A"}
					/>
					<ReportDetailField
						label="Associates"
						className="sm:col-span-2"
						value={associates.length > 0 ? associates.join(", ") : "N/A"}
					/>
				</div>

				<div className="space-y-3">
					<p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
						Hit Details
					</p>
					{fieldEntries.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							No additional details available for this hit.
						</p>
					) : (
						fieldEntries.map(([key]) => {
							const items = getFieldItems(fields, key);
							const value = items
								.map((item) =>
									item.source ? `${item.value} (${item.source})` : item.value,
								)
								.join(", ");

							return (
								<ReportDetailField
									key={key}
									label={formatLabel(key)}
									value={value || "N/A"}
								/>
							);
						})
					)}
				</div>
			</CardContent>
		</Card>
	);
}

export function AmlScreeningDownloadReport({
	verification,
}: {
	verification: AmlScreeningVerificationRequestDetail;
}) {
	const responseData = asRecord(verification.response_data) ?? {};
	const responsePayload = (asRecord(responseData.data) ??
		responseData) as AmlScreeningResponsePayload;
	const verificationData = asRecord(responsePayload.verification_data) ?? {};
	const backgroundChecksData =
		asRecord(verificationData.background_checks) ??
		asRecord(responsePayload.background_checks) ??
		{};

	const amlData = asRecord(backgroundChecksData.aml_data) ?? {};
	const hits = asArray(amlData.hits).filter((hit) =>
		isPlainObject(hit),
	) as AmlHit[];

	const appliedFilters = normalizeTextList(backgroundChecksData.filters).map(
		(filter) => formatLabel(filter),
	);
	const screeningName =
		typeof asRecord(backgroundChecksData.name)?.full_name === "string"
			? String(asRecord(backgroundChecksData.name)?.full_name)
			: "Not provided";
	const matchScore = backgroundChecksData.match_score;

	const verificationResult =
		asRecord(responsePayload.verification_result) ?? {};
	const backgroundCheckResult = verificationResult.background_checks;
	const screeningResult =
		typeof backgroundCheckResult === "boolean"
			? backgroundCheckResult
				? "Passed"
				: "Failed"
			: typeof backgroundCheckResult === "string"
				? formatLabel(backgroundCheckResult)
				: verification.status.toLowerCase() === "success"
					? "Passed"
					: verification.status.toLowerCase() === "failed"
						? "Failed"
						: "Unknown";

	const infoData = asRecord(responsePayload.info) ?? {};
	const geolocation = asRecord(infoData.geolocation) ?? {};
	const agent = asRecord(infoData.agent) ?? {};

	return (
		<div className="space-y-6">
			<ReportOverviewCard
				status={verification.status}
				verificationType={formatLabel(verification.verification_type)}
				reference={verification.reference}
				createdAt={new Date(verification.created_at).toLocaleString()}
				verificationEvent={
					typeof responsePayload.event === "string"
						? responsePayload.event
						: undefined
				}
				customerEmail={
					typeof responsePayload.email === "string"
						? responsePayload.email
						: undefined
				}
				customerUniqueId={
					typeof responsePayload.customer_unique_id === "string"
						? responsePayload.customer_unique_id
						: undefined
				}
				country={
					typeof responsePayload.country === "string"
						? responsePayload.country
						: undefined
				}
				declinedReason={asNonEmptyString(responsePayload.declined_reason)}
			/>

			<Card>
				<CardHeader>
					<CardTitle className="text-base font-semibold">
						Background Checks
					</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4 sm:grid-cols-2">
					<ReportDetailField
						label="Full Name"
						value={screeningName}
					/>
					<ReportDetailField
						label="Screening Result"
						value={
							<Badge
								variant="outline"
								className={cn(
									screeningResult.toLowerCase() === "passed"
										? "border-emerald-200 bg-emerald-50 text-emerald-700"
										: "border-red-200 bg-red-50 text-red-700",
								)}
							>
								{screeningResult}
							</Badge>
						}
					/>
					<ReportDetailField
						label="Applied Filters"
						value={
							appliedFilters.length > 0 ? (
								<div className="flex flex-wrap gap-1">
									{appliedFilters.map((filter) => (
										<Badge
											key={filter}
											variant="outline"
										>
											{filter}
										</Badge>
									))}
								</div>
							) : (
								"N/A"
							)
						}
					/>
					<ReportDetailField
						label="Match Score"
						value={
							typeof matchScore === "number" || typeof matchScore === "string"
								? `${matchScore}`
								: "N/A"
						}
					/>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="text-base font-semibold">
						Hits ({hits.length})
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{hits.length > 0 ? (
						hits.map((hit, index) => (
							<HitDownloadCard
								key={getHitRenderKey(hit)}
								hit={hit}
								index={index}
							/>
						))
					) : (
						<p className="text-sm text-muted-foreground">No hits available.</p>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="text-base font-semibold">
						Device & Location
					</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4 sm:grid-cols-2">
					<ReportDetailField
						label="Device"
						value={toDisplayValue(agent.device ?? responsePayload.device)}
					/>
					<ReportDetailField
						label="Desktop Device"
						value={toDisplayValue(
							agent.is_desktop ?? responsePayload.is_desktop,
						)}
					/>
					<ReportDetailField
						label="IP Address"
						value={toDisplayValue(geolocation.ip ?? responsePayload.ip)}
					/>
					<ReportDetailField
						label="Location"
						value={toDisplayValue(
							[geolocation.city, geolocation.region, geolocation.country]
								.filter(Boolean)
								.join(", "),
						)}
					/>
					<ReportDetailField
						label="Timezone"
						value={toDisplayValue(geolocation.timezone)}
					/>
					<ReportDetailField
						label="ISP"
						value={toDisplayValue(geolocation.isp)}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
