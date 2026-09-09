import type {
	VerificationAgentInfo,
	VerificationGeoLocation,
	VerificationRequestDetail,
} from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@verifyafrica/ui/components/ui/card";
import { displayValue } from "../-utils";
import { ReportDetailField } from "./report-detail-field";

function formatInfoValue(value: unknown) {
	if (typeof value === "boolean") {
		return value ? "Yes" : "No";
	}

	return displayValue(value);
}

function hasInfoValues(value: object | undefined) {
	if (!value) {
		return false;
	}

	return Object.values(value).some(
		(entry) => entry !== null && entry !== undefined && entry !== "",
	);
}

function AgentCard({ agent }: { agent: VerificationAgentInfo }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base font-semibold">Agent</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-4 sm:grid-cols-2">
				<ReportDetailField
					label="Is Desktop"
					value={formatInfoValue(agent.is_desktop)}
				/>
				<ReportDetailField
					label="Is Phone"
					value={formatInfoValue(agent.is_phone)}
				/>
				<ReportDetailField
					label="Useragent"
					className="sm:col-span-2"
					value={formatInfoValue(agent.useragent)}
					valueClassName="break-all"
				/>
				<ReportDetailField
					label="Device Name"
					value={formatInfoValue(agent.device_name)}
				/>
				<ReportDetailField
					label="Browser Name"
					value={formatInfoValue(agent.browser_name)}
				/>
				<ReportDetailField
					label="Platform Name"
					value={formatInfoValue(agent.platform_name)}
				/>
				<ReportDetailField
					label="Fingerprint ID"
					className="sm:col-span-2"
					value={formatInfoValue(agent.fingerprint_id)}
					mono
				/>
			</CardContent>
		</Card>
	);
}

function GeolocationCard({
	geolocation,
}: {
	geolocation: VerificationGeoLocation;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base font-semibold">Geolocation</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-4 sm:grid-cols-2">
				<ReportDetailField
					label="Host"
					value={formatInfoValue(geolocation.host)}
				/>
				<ReportDetailField
					label="IP"
					value={formatInfoValue(geolocation.ip)}
				/>
				<ReportDetailField
					label="RDNS"
					value={formatInfoValue(geolocation.rdns)}
				/>
				<ReportDetailField
					label="ASN"
					value={formatInfoValue(geolocation.asn)}
				/>
				<ReportDetailField
					label="ISP"
					value={formatInfoValue(geolocation.isp)}
				/>
				<ReportDetailField
					label="Country Name"
					value={formatInfoValue(geolocation.country_name ?? geolocation.country)}
				/>
				<ReportDetailField
					label="Country Code"
					value={formatInfoValue(geolocation.country_code)}
				/>
				<ReportDetailField
					label="Region Name"
					value={formatInfoValue(geolocation.region_name ?? geolocation.region)}
				/>
				<ReportDetailField
					label="Region Code"
					value={formatInfoValue(geolocation.region_code)}
				/>
				<ReportDetailField
					label="City"
					value={formatInfoValue(geolocation.city)}
				/>
				<ReportDetailField
					label="Postal Code"
					value={formatInfoValue(geolocation.postal_code)}
				/>
				<ReportDetailField
					label="Continent Name"
					value={formatInfoValue(geolocation.continent_name)}
				/>
				<ReportDetailField
					label="Continent Code"
					value={formatInfoValue(geolocation.continent_code)}
				/>
				<ReportDetailField
					label="Latitude"
					value={formatInfoValue(geolocation.latitude)}
				/>
				<ReportDetailField
					label="Longitude"
					value={formatInfoValue(geolocation.longitude)}
				/>
				<ReportDetailField
					label="Timezone"
					value={formatInfoValue(geolocation.timezone)}
				/>
				<ReportDetailField
					label="IP Type"
					value={formatInfoValue(geolocation.ip_type)}
					valueClassName="capitalize"
				/>
				<ReportDetailField
					label="Capital"
					value={formatInfoValue(geolocation.capital)}
				/>
				<ReportDetailField
					label="Currency"
					value={formatInfoValue(geolocation.currency)}
				/>
			</CardContent>
		</Card>
	);
}

export function MoreInfo({
	verification,
}: {
	verification: VerificationRequestDetail;
}) {
	const info = verification.response_data.info;
	const agent = info?.agent;
	const geolocation = info?.geolocation;
	const showAgent = hasInfoValues(agent);
	const showGeolocation = hasInfoValues(geolocation);

	if (!showAgent && !showGeolocation) {
		return null;
	}

	return (
		<section className="flex flex-col gap-4">
			<h2 className="text-lg font-semibold">Info</h2>
			{showAgent && agent ? <AgentCard agent={agent} /> : null}
			{showGeolocation && geolocation ? (
				<GeolocationCard geolocation={geolocation} />
			) : null}
		</section>
	);
}
