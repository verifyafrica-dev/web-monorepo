import {
	ArrowLeftIcon,
	CopyIcon,
	MagnifyingGlassIcon,
} from "@phosphor-icons/react";
import { type RefObject, useMemo, useState } from "react";

import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@verifyafrica/ui/components/ui/card";
import { Input } from "@verifyafrica/ui/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@verifyafrica/ui/components/ui/tabs";
import { useClipboard } from "#/hooks/use-clipboard";
import { cn } from "#/lib/utils.ts";
import { isPlainObject } from "#/lib/validators";
import { asNonEmptyString, asRecord } from "../-utils";
import { AmlScreeningDownloadReport } from "./aml-screening/aml-screening-download-report";
import { ReportOverviewCard } from "./report-overview-card";
import { ReportDetailField } from "./report-detail-field";
import { VerificationMetadataCard } from "./verification-metadata-card";
import type {
	AmlScreeningResponsePayload,
	AmlScreeningVerificationRequestDetail,
} from "#/api/http/v2/verifications/verifications.types";

type AmlHit = Record<string, unknown>;

type ScoreFilter = "all" | "high" | "medium" | "low";

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

function getMatchBadgeLabel(matchTypes: string[]) {
	if (matchTypes.includes("exact_match")) {
		return "Exact Match";
	}

	if (matchTypes.includes("potential_match")) {
		return "Potential Match";
	}

	if (matchTypes.includes("profile_name")) {
		return "Profile Name";
	}

	return "Match";
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

function StatusPill({ status }: { status: string }) {
	const normalizedStatus = status.toLowerCase();
	const className =
		normalizedStatus === "success" || normalizedStatus === "completed"
			? "bg-emerald-100 text-emerald-700"
			: normalizedStatus === "failed" || normalizedStatus === "error"
				? "bg-red-100 text-red-700"
				: "bg-muted text-muted-foreground";

	return (
		<span
			className={cn(
				"inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase",
				className,
			)}
		>
			{status}
		</span>
	);
}

function CopyValueButton({ value }: { value: string }) {
	const { copy } = useClipboard();

	if (!value) {
		return null;
	}

	return (
		<Button
			type="button"
			size="icon"
			variant="ghost"
			className="size-6 cursor-pointer text-muted-foreground"
			onClick={() => void copy(value)}
		>
			<CopyIcon className="size-3.5" />
		</Button>
	);
}

function RawResponseCard({ data }: { data: Record<string, unknown> }) {
	const [expanded, setExpanded] = useState(false);

	return (
		<Card>
			<CardHeader
				className="cursor-pointer pb-3"
				onClick={() => setExpanded((previous) => !previous)}
			>
				<CardTitle className="text-base font-semibold">
					Raw Response Data
				</CardTitle>
			</CardHeader>
			{expanded ? (
				<CardContent className="pt-0">
					<pre className="max-h-80 overflow-auto rounded-md border bg-muted/30 p-3 text-xs">
						{JSON.stringify(data, null, 2)}
					</pre>
				</CardContent>
			) : null}
		</Card>
	);
}

function RiskStatCard({
	label,
	value,
	className,
}: {
	label: string;
	value: number;
	className: string;
}) {
	return (
		<Card>
			<CardContent className="pt-0">
				<p className={cn("text-3xl font-semibold tracking-tight", className)}>
					{value}
				</p>
				<p className="text-xs uppercase tracking-wide text-muted-foreground">
					{label}
				</p>
			</CardContent>
		</Card>
	);
}

function HitScoreCircle({ score }: { score: number }) {
	const percent = Math.round(score * 100);

	return (
		<div className="flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-red-300 text-xs font-semibold text-red-700">
			{percent}
		</div>
	);
}

type HitCardProps = {
	hit: AmlHit;
	index: number;
	onSelect: () => void;
};

function HitCard({ hit, index, onSelect }: HitCardProps) {
	const score = normalizeScore(hit.score);
	const level = getRiskLevel(score);
	const matchTypes = normalizeTextList(hit.match_types).map((item) =>
		item.toLowerCase(),
	);
	const matchBadgeLabel = getMatchBadgeLabel(matchTypes);
	const fields = asRecord(hit.fields) ?? {};
	const categories = getFieldItems(fields, "Categories")
		.map((item) => item.value.split(" - ")[0]?.trim())
		.filter(Boolean);
	const aliases = normalizeTextList(hit.alternative_names);
	const associates = getAssociates(hit);
	const country =
		getFieldItems(fields, "Country")[0]?.value ??
		getFieldItems(fields, "Citizenship")[0]?.value;

	return (
		<button
			type="button"
			onClick={onSelect}
			className="flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary/40"
		>
			<HitScoreCircle score={score} />
			<div className="min-w-0 flex-1 space-y-2">
				<div className="flex flex-wrap items-center gap-2">
					<p className="truncate text-sm font-semibold text-foreground">
						{String(hit.name ?? "Unnamed Hit")}
					</p>
					<Badge
						variant="outline"
						className="border-red-200 bg-red-50 text-red-700"
					>
						{matchBadgeLabel}
					</Badge>
				</div>
				<div className="flex flex-wrap gap-1">
					{categories.map((category) => (
						<Badge
							key={category}
							variant="outline"
						>
							{category}
						</Badge>
					))}
				</div>
				<div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
					{country ? <p>CTY {country}</p> : null}
					{associates.length > 0 ? (
						<p>
							{associates.length} associate{associates.length > 1 ? "s" : ""}
						</p>
					) : null}
					{aliases.length > 0 ? (
						<p>
							{aliases.length} alias{aliases.length > 1 ? "es" : ""}
						</p>
					) : null}
				</div>
			</div>
			<p className="text-xs text-muted-foreground">#{index + 1}</p>
			<p
				className={cn(
					"text-sm font-semibold capitalize",
					getRiskClassName(level),
				)}
			>
				{level}
			</p>
		</button>
	);
}

type HitDetailProps = {
	hit: AmlHit;
	onBack: () => void;
};

function HitDetail({ hit, onBack }: HitDetailProps) {
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
		<div className="space-y-4">
			<Button
				type="button"
				variant="outline"
				className="cursor-pointer"
				onClick={onBack}
			>
				<ArrowLeftIcon />
				See Hit List
			</Button>

			<Card>
				<CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-start sm:justify-between">
					<div className="flex items-start gap-4">
						<HitScoreCircle score={score} />
						<div className="space-y-2">
							<div className="flex flex-wrap items-center gap-2">
								<h3 className="text-2xl font-semibold tracking-tight">
									{String(hit.name ?? "Unnamed Hit")}
								</h3>
								<Badge
									variant="outline"
									className="border-red-200 bg-red-50 text-red-700"
								>
									{getMatchBadgeLabel(
										matchTypes.map((item) => item.toLowerCase()),
									)}
								</Badge>
							</div>
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
						</div>
					</div>
					<div className="text-left sm:text-right">
						<p className="text-xs uppercase tracking-wide text-muted-foreground">
							Risk Level
						</p>
						<p
							className={cn(
								"text-2xl font-semibold capitalize",
								getRiskClassName(level),
							)}
						>
							{level}
						</p>
						<p className="text-sm text-muted-foreground">
							{Math.round(score * 100)}% match
						</p>
					</div>
				</CardContent>
			</Card>

			<Tabs
				defaultValue="overview"
				className="w-full"
			>
				<TabsList
					variant="line"
					className="w-full justify-start"
				>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="aliases">Aliases ({aliases.length})</TabsTrigger>
					<TabsTrigger value="associates">
						Associates ({associates.length})
					</TabsTrigger>
				</TabsList>

				<TabsContent
					value="overview"
					className="pt-4"
				>
					<Card>
						<CardContent className="space-y-5 pt-6">
							{fieldEntries.length === 0 ? (
								<p className="text-sm text-muted-foreground">
									No additional details available for this hit.
								</p>
							) : (
								fieldEntries.map(([key]) => {
									const items = getFieldItems(fields, key);

									return (
										<div
											key={key}
											className="space-y-2"
										>
											<p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
												{formatLabel(key)}
											</p>
											<div className="space-y-2">
												{items.map((item) => (
													<div
														key={`${key}-${item.value}`}
														className="flex items-start justify-between gap-3"
													>
														<p className="text-sm text-foreground">
															{item.value}
														</p>
														{item.source ? (
															<p className="text-xs text-muted-foreground">
																{item.source}
															</p>
														) : null}
													</div>
												))}
											</div>
										</div>
									);
								})
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent
					value="aliases"
					className="pt-4"
				>
					<Card>
						<CardContent className="pt-6">
							{aliases.length === 0 ? (
								<p className="text-sm text-muted-foreground">
									No aliases recorded.
								</p>
							) : (
								<div className="space-y-2">
									{aliases.map((alias) => (
										<div
											key={alias}
											className="rounded-md border px-3 py-2 text-sm"
										>
											{alias}
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent
					value="associates"
					className="pt-4"
				>
					<Card>
						<CardContent className="pt-6">
							{associates.length === 0 ? (
								<p className="text-sm text-muted-foreground">
									No associates recorded.
								</p>
							) : (
								<div className="space-y-2">
									{associates.map((associate) => (
										<div
											key={associate}
											className="rounded-md border px-3 py-2 text-sm"
										>
											{associate}
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}

export function AmlScreeningReport({
	verification,
	downloadRef,
}: {
	verification: AmlScreeningVerificationRequestDetail;
	downloadRef?: RefObject<HTMLDivElement | null>;
}) {
	const [selectedHitIndex, setSelectedHitIndex] = useState<number | null>(null);
	const [filterText, setFilterText] = useState("");
	const [scoreFilter, setScoreFilter] = useState<ScoreFilter>("all");

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

	const selectedHit =
		selectedHitIndex !== null ? (hits[selectedHitIndex] ?? null) : null;

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

	const stats = useMemo(() => {
		const normalizedScores = hits.map((hit) => normalizeScore(hit.score));
		const high = normalizedScores.filter((score) => score >= 0.95).length;
		const medium = normalizedScores.filter(
			(score) => score >= 0.85 && score < 0.95,
		).length;
		const low = normalizedScores.filter((score) => score < 0.85).length;

		return {
			total: hits.length,
			high,
			medium,
			low,
		};
	}, [hits]);

	const filteredHitEntries = useMemo(
		() =>
			hits
				.map((hit, index) => ({ hit, index }))
				.filter(({ hit }) => {
					const matchesText =
						!filterText ||
						String(hit.name ?? "")
							.toLowerCase()
							.includes(filterText.toLowerCase());
					const score = normalizeScore(hit.score);
					const level = getRiskLevel(score);
					const matchesScore = scoreFilter === "all" || scoreFilter === level;

					return matchesText && matchesScore;
				}),
		[hits, filterText, scoreFilter],
	);

	return (
		<div className="space-y-6">
			<ReportOverviewCard
				status={<StatusPill status={verification.status} />}
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
				renderCopyButton={(value) => <CopyValueButton value={value} />}
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

			{selectedHit ? (
				<HitDetail
					hit={selectedHit}
					onBack={() => setSelectedHitIndex(null)}
				/>
			) : (
				<>
					<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
						<RiskStatCard
							label="Total Hits"
							value={stats.total}
							className="text-primary"
						/>
						<RiskStatCard
							label="High Risk"
							value={stats.high}
							className="text-red-700"
						/>
						<RiskStatCard
							label="Medium Risk"
							value={stats.medium}
							className="text-amber-700"
						/>
						<RiskStatCard
							label="Low Risk"
							value={stats.low}
							className="text-lime-700"
						/>
					</div>

					<Card>
						<CardContent className="space-y-4 pt-6">
							<div className="flex flex-col gap-3 lg:flex-row lg:items-center">
								<div className="relative flex-1">
									<MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										value={filterText}
										onChange={(event) => setFilterText(event.target.value)}
										placeholder="Filter by name..."
										className="pl-8"
									/>
								</div>
								<div className="flex items-center gap-2">
									{[
										{ key: "all", label: "All" },
										{ key: "high", label: "High" },
										{ key: "medium", label: "Med" },
										{ key: "low", label: "Low" },
									].map((filter) => (
										<Button
											key={filter.key}
											type="button"
											size="sm"
											variant={
												scoreFilter === filter.key ? "default" : "outline"
											}
											className="cursor-pointer"
											onClick={() => setScoreFilter(filter.key as ScoreFilter)}
										>
											{filter.label}
										</Button>
									))}
								</div>
								<p className="text-xs text-muted-foreground">
									{filteredHitEntries.length} / {hits.length} hits
								</p>
							</div>

							{filteredHitEntries.length > 0 ? (
								<div className="grid gap-3 lg:grid-cols-2">
									{filteredHitEntries.map(({ hit, index }) => (
										<HitCard
											key={getHitRenderKey(hit)}
											hit={hit}
											index={index}
											onSelect={() => setSelectedHitIndex(index)}
										/>
									))}
								</div>
							) : (
								<p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
									No hits match the current filters.
								</p>
							)}
						</CardContent>
					</Card>
				</>
			)}

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
						value={
							<div className="flex items-center gap-1">
								<span>
									{toDisplayValue(geolocation.ip ?? responsePayload.ip)}
								</span>
								{typeof geolocation.ip === "string" ? (
									<CopyValueButton value={geolocation.ip} />
								) : null}
							</div>
						}
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

			<RawResponseCard data={responsePayload} />

			{downloadRef ? (
				<div
					aria-hidden
					className="pointer-events-none fixed top-0 left-[-200vw] w-[1024px] opacity-0"
				>
					<div
						ref={downloadRef}
						className="flex flex-col gap-6 bg-background"
					>
						<VerificationMetadataCard verification={verification} />
						<AmlScreeningDownloadReport verification={verification} />
					</div>
				</div>
			) : null}
		</div>
	);
}
