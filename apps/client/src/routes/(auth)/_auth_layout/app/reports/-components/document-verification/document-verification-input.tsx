import type { ReportField } from "../report-sections";
import { ReportFieldGrid, ReportSectionCard } from "../report-sections";

export function DocumentVerificationInput({
	fields,
}: {
	fields: ReportField[];
}) {
	if (fields.length === 0) return null;

	return (
		<ReportSectionCard title="Submitted Information">
			<ReportFieldGrid fields={fields} />
		</ReportSectionCard>
	);
}
