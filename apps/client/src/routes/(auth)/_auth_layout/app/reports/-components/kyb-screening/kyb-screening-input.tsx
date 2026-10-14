import type { ReportField } from "../report-sections";
import { ReportFieldGrid, ReportSectionCard } from "../report-sections";

export function KybScreeningInput({ fields }: { fields: ReportField[] }) {
	if (fields.length === 0) return null;

	return (
		<ReportSectionCard title="KYB Input Data">
			<ReportFieldGrid fields={fields} />
		</ReportSectionCard>
	);
}
