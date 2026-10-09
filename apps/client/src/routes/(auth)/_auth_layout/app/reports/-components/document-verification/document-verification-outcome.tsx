import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { cn } from "@verifyafrica/ui/lib/utils";

import { ReportDetailField } from "../report-detail-field";
import { ReportSectionCard } from "../report-sections";
import {
	type DocumentCheck,
	formatDocumentType,
} from "./document-verification-sections";

function getResultValueLabel(
	value: unknown,
): "Passed" | "Failed" | "Not available" {
	if (value === null || value === undefined || value === "") {
		return "Not available";
	}

	if (typeof value === "number") {
		return value > 0 ? "Passed" : "Failed";
	}

	if (typeof value === "boolean") {
		return value ? "Passed" : "Failed";
	}

	if (typeof value === "string") {
		const normalized = value.trim().toLowerCase();
		if (!normalized) {
			return "Not available";
		}

		if (
			normalized === "passed" ||
			normalized === "success" ||
			normalized === "true" ||
			normalized === "1"
		) {
			return "Passed";
		}

		if (
			normalized === "failed" ||
			normalized === "error" ||
			normalized === "false" ||
			normalized === "0"
		) {
			return "Failed";
		}
	}

	return "Not available";
}

const NOT_AVAILABLE_BADGE_CLASS =
	"border-slate-300 bg-slate-100 text-slate-700";

function ResultBadge({ value }: { value: unknown }) {
	const label = getResultValueLabel(value);

	return (
		<Badge
			variant="outline"
			className={cn(
				label === "Passed" && "border-emerald-200 bg-emerald-500 text-white",
				label === "Failed" && "border-red-200 bg-red-500 text-white",
				label === "Not available" && NOT_AVAILABLE_BADGE_CLASS,
			)}
		>
			{label}
		</Badge>
	);
}

function BadgeList({
	values,
	format = (value) => value,
	mono = false,
}: {
	values: string[];
	format?: (value: string) => string | undefined;
	mono?: boolean;
}) {
	if (values.length === 0) {
		return (
			<Badge variant="outline" className={NOT_AVAILABLE_BADGE_CLASS}>
				Not available
			</Badge>
		);
	}

	return (
		<div className="flex flex-wrap gap-1">
			{values.map((value) => (
				<Badge
					key={value}
					variant="outline"
					className={cn(mono && "font-mono")}
				>
					{format(value) ?? value}
				</Badge>
			))}
		</div>
	);
}

export function DocumentVerificationOutcome({
	declinedReason,
	declinedCodes,
	selectedTypes,
	supportedTypes,
	checks,
}: {
	declinedReason?: string;
	declinedCodes: string[];
	selectedTypes: string[];
	supportedTypes: string[];
	checks: DocumentCheck[];
}) {
	return (
		<ReportSectionCard title="Document Verification Outcome">
			<div className="grid gap-4 sm:grid-cols-2">
				{declinedReason ? (
					<ReportDetailField
						label="Declined Reason"
						className="sm:col-span-2"
						value={<span className="font-medium">{declinedReason}</span>}
					/>
				) : null}
				{declinedCodes.length > 0 ? (
					<ReportDetailField
						label="Declined Codes"
						className="sm:col-span-2"
						value={<BadgeList values={declinedCodes} mono />}
					/>
				) : null}
				<ReportDetailField
					label="Selected Type"
					value={
						<BadgeList values={selectedTypes} format={formatDocumentType} />
					}
				/>
				<ReportDetailField
					label="Supported Types"
					value={
						<BadgeList values={supportedTypes} format={formatDocumentType} />
					}
				/>
			</div>
			<div className="space-y-3 border-t pt-4">
				<p className="text-sm font-medium">Verification Checks</p>
				<div className="grid gap-4 sm:grid-cols-2">
					{checks.map((check) => (
						<ReportDetailField
							key={check.key}
							label={check.label}
							value={<ResultBadge value={check.value} />}
						/>
					))}
				</div>
			</div>
		</ReportSectionCard>
	);
}
