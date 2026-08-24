import type { VerificationRequestDetail } from "#/api/http/v2/verifications/verifications.types";
import { asNonEmptyString, asRecord } from "../-utils";
import { ReportOverviewCard } from "./report-overview-card";
import { VerificationResultPanel } from "./verification-result-panel";

function formatVerificationType(value: string) {
	return value
		.replace(/_/g, " ")
		.replace(/-/g, " ")
		.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function GenericVerificationDetailReport({
	verification,
}: {
	verification: VerificationRequestDetail;
}) {
	const responseData = asRecord(verification.response_data) ?? {};
	const responsePayload = (asRecord(responseData.data) ??
		responseData) as Record<string, unknown>;

	const infoData = asRecord(responsePayload.info);
	const { proofs: _proofs, info: _info, ...resultData } = responsePayload;

	const country =
		typeof responsePayload.country === "string"
			? responsePayload.country
			: typeof verification.input_data.country === "string"
				? verification.input_data.country
				: undefined;

	const customerEmail =
		typeof responsePayload.email === "string"
			? responsePayload.email
			: typeof verification.input_data.email === "string"
				? verification.input_data.email
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
				verificationEvent={
					typeof responsePayload.event === "string"
						? responsePayload.event
						: undefined
				}
				customerEmail={customerEmail}
				customerUniqueId={
					typeof responsePayload.customer_unique_id === "string"
						? responsePayload.customer_unique_id
						: undefined
				}
				country={country}
				declinedReason={asNonEmptyString(responsePayload.declined_reason)}
			/>

			<VerificationResultPanel data={resultData} />

			{infoData ? (
				<VerificationResultPanel
					title="Info"
					data={infoData}
				/>
			) : null}
		</div>
	);
}
