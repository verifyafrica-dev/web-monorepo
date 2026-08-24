import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@verifyafrica/ui/components/ui/card";
import { asNonEmptyString, asRecord, displayValue } from "../-utils";
import { ReportOverviewCard } from "./report-overview-card";
import { ReportDetailField } from "./report-detail-field";
import { ProofImagePreviewDialog } from "./verification-proofs/proof-image-preview-dialog";
import type {
	GovernmentRegistryChecksVerificationRequestDetail,
	GovernmentRegistryChecksResponsePayload,
} from "#/api/http/v2/verifications/verifications.types";

type RenderField = {
	key: string;
	label: string;
	value: ReactNode;
};

/** Keys rendered in named sections — excluded from "Additional Details". */
const HANDLED_KEYS = new Set([
	"id",
	"reference",
	"first_name",
	"last_name",
	"middle_name",
	"phone_number",
	"email",
	"gender",
	"id_type",
	"image",
	"signature",
	"address",
	"nationality",
	"date_of_birth",
	"validation",
	"submitted_selfie",
	"status",
	"message",
]);

function formatVerificationType(value: string) {
	return value
		.replace(/_/g, " ")
		.replace(/-/g, " ")
		.replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatLabel(key: string) {
	return key
		.split("_")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

function isImageString(value: string) {
	const normalized = value.trim().toLowerCase();
	return (
		normalized.startsWith("data:image/") ||
		normalized.startsWith("http://") ||
		normalized.startsWith("https://")
	);
}

function SectionCard({
	title,
	fields,
}: {
	title: string;
	fields: RenderField[];
}) {
	if (fields.length === 0) {
		return null;
	}

	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="text-base font-semibold">{title}</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-4 sm:grid-cols-2">
				{fields.map((field) => (
					<ReportDetailField
						key={field.key}
						label={field.label}
						value={field.value}
					/>
				))}
			</CardContent>
		</Card>
	);
}

export function GovernmentRegistryChecksReport({
	verification,
}: {
	verification: GovernmentRegistryChecksVerificationRequestDetail;
}) {
	const responseData = asRecord(verification.response_data) ?? {};
	// Korapay shape: { status, message, data: { first_name, ... } }
	// Identity fields live on response_data.data — do not unwrap a second .data.
	const sourceData = (asRecord(responseData.data) ??
		responseData) as GovernmentRegistryChecksResponsePayload;
	const addressData = asRecord(sourceData.address);

	const fullAddress = [
		addressData?.street,
		addressData?.town,
		addressData?.lga,
		addressData?.state,
	]
		.filter((part) => typeof part === "string" && part.trim().length > 0)
		.join(", ");

	const personalInformationFields: RenderField[] = [
		{
			key: "first_name",
			label: "First Name",
			value: displayValue(sourceData.first_name),
		},
		{
			key: "last_name",
			label: "Last Name",
			value: displayValue(sourceData.last_name),
		},
		{
			key: "middle_name",
			label: "Middle Name",
			value: displayValue(sourceData.middle_name),
		},
		{ key: "gender", label: "Gender", value: displayValue(sourceData.gender) },
		{
			key: "date_of_birth",
			label: "Date of Birth",
			value: displayValue(sourceData.date_of_birth),
		},
		{
			key: "nationality",
			label: "Nationality",
			value: displayValue(sourceData.nationality),
		},
	];

	const imageFields = [
		{ key: "image", label: "Registry Photo", value: sourceData.image },
		{ key: "signature", label: "Signature", value: sourceData.signature },
		{
			key: "submitted_selfie",
			label: "Submitted Selfie",
			value: sourceData.submitted_selfie,
		},
	].filter(
		(field): field is { key: string; label: string; value: string } =>
			typeof field.value === "string" && isImageString(field.value),
	);

	const documentDetailFields: RenderField[] = [
		{
			key: "id_type",
			label: "ID Type",
			value: displayValue(sourceData.id_type),
		},
		{ key: "id", label: "ID", value: displayValue(sourceData.id) },
		{
			key: "reference",
			label: "Reference",
			value: displayValue(sourceData.reference),
		},
	];

	const contactLocationFields: RenderField[] = [
		{
			key: "phone_number",
			label: "Phone Number",
			value: displayValue(sourceData.phone_number),
		},
		{
			key: "email",
			label: "Email",
			value: displayValue(sourceData.email),
		},
		{
			key: "address",
			label: "Address",
			value: displayValue(
				fullAddress ||
					(typeof sourceData.address === "string" ? sourceData.address : null),
			),
		},
	];

	const validation = asRecord(sourceData.validation);
	const validationFields: RenderField[] = [];
	if (validation) {
		const validationEntries: Array<[string, string]> = [
			["first_name", "First Name"],
			["last_name", "Last Name"],
			["date_of_birth", "Date of Birth"],
			["selfie", "Selfie"],
		];
		for (const [key, label] of validationEntries) {
			const field = asRecord(validation[key]);
			if (!field || !("match" in field)) {
				continue;
			}
			validationFields.push({
				key: `validation_${key}`,
				label,
				value: field.match ? "Match" : "No Match",
			});
		}
	}

	const additionalDetailFields: RenderField[] = Object.entries(sourceData)
		.filter(([key, value]) => {
			if (HANDLED_KEYS.has(key)) return false;
			if (value === null || value === undefined || value === "") return false;
			if (typeof value === "object") return false;
			return true;
		})
		.map(([key, value]) => ({
			key,
			label: formatLabel(key),
			value: displayValue(value),
		}));

	const country =
		typeof responseData.country === "string"
			? responseData.country
			: typeof sourceData.country === "string"
				? sourceData.country
				: typeof verification.input_data.country === "string"
					? verification.input_data.country
					: undefined;

	const customerEmail =
		typeof responseData.email === "string"
			? responseData.email
			: typeof sourceData.email === "string"
				? sourceData.email
				: typeof verification.input_data.email === "string"
					? verification.input_data.email
					: undefined;

	const verificationEvent =
		typeof responseData.event === "string"
			? responseData.event
			: typeof sourceData.event === "string"
				? sourceData.event
				: undefined;

	const customerUniqueId =
		typeof responseData.customer_unique_id === "string"
			? responseData.customer_unique_id
			: typeof sourceData.customer_unique_id === "string"
				? sourceData.customer_unique_id
				: undefined;

	return (
		<div className="space-y-6">
			<ReportOverviewCard
				status={verification.status}
				verificationType={formatVerificationType(
					verification.verification_type,
				)}
				reference={verification.reference}
				createdAt={new Date(verification.created_at).toLocaleString()}
				verificationEvent={verificationEvent}
				customerEmail={customerEmail}
				customerUniqueId={customerUniqueId}
				country={country}
				declinedReason={asNonEmptyString(
					responseData.declined_reason ?? sourceData.declined_reason,
				)}
			/>

			<SectionCard
				title="Personal Information"
				fields={personalInformationFields}
			/>

			{imageFields.length > 0 ? (
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-base font-semibold">Images</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-4 sm:grid-cols-2">
						{imageFields.map((field) => (
							<ReportDetailField
								key={field.key}
								label={field.label}
								value={
									<ProofImagePreviewDialog
										src={field.value}
										alt={field.label}
										label={field.label}
										thumbnailClassName="max-h-40 rounded-md border object-cover"
									/>
								}
							/>
						))}
					</CardContent>
				</Card>
			) : null}

			<SectionCard
				title="Document Details"
				fields={documentDetailFields}
			/>
			<SectionCard
				title="Contact & Location"
				fields={contactLocationFields}
			/>
			<SectionCard
				title="Validation Results"
				fields={validationFields}
			/>
			<SectionCard
				title="Additional Details"
				fields={additionalDetailFields}
			/>
		</div>
	);
}
