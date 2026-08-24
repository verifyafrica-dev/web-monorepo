import { Card, CardContent, CardHeader, CardTitle } from "@verifyafrica/ui/components/ui/card";
import { displayValue } from "../../-utils";
import { ReportDetailField } from "../report-detail-field";

type DocumentIdentity = {
	fullName?: string;
	firstName?: string;
	lastName?: string;
	dateOfBirth?: string;
	gender?: string;
	nationality?: string;
	placeOfBirth?: string;
};

type DocumentVerificationIdentityCardProps = {
	identity: DocumentIdentity;
};

export function DocumentVerificationIdentityCard({
	identity,
}: DocumentVerificationIdentityCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base font-semibold">Identity</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-4 sm:grid-cols-2">
				<ReportDetailField
					label="Full Name"
					value={displayValue(identity.fullName)}
				/>
				<ReportDetailField
					label="First Name"
					value={displayValue(identity.firstName)}
				/>
				<ReportDetailField
					label="Last Name"
					value={displayValue(identity.lastName)}
				/>
				<ReportDetailField
					label="Date of Birth"
					value={displayValue(identity.dateOfBirth)}
				/>
				<ReportDetailField
					label="Gender"
					value={displayValue(identity.gender)}
				/>
				<ReportDetailField
					label="Nationality"
					value={displayValue(identity.nationality)}
					valueClassName="capitalize"
				/>
				<ReportDetailField
					label="Place of Birth"
					value={displayValue(identity.placeOfBirth)}
				/>
			</CardContent>
		</Card>
	);
}
