import {
	ArrowSquareOutIcon,
	DownloadSimpleIcon,
	FileTextIcon,
} from "@phosphor-icons/react";
import { Button } from "@verifyafrica/ui/components/ui/button";
import {
	COMPLIANCE_DOCUMENT_CATEGORIES,
	formatComplianceFileSize,
	getComplianceDocumentsByCategory,
} from "../-data";

export function ComplianceDocumentsSection({
	complianceData,
}: {
	complianceData: Record<string, unknown>;
}) {
	const categoriesWithDocuments = COMPLIANCE_DOCUMENT_CATEGORIES.map(
		(category) => ({
			...category,
			documents: getComplianceDocumentsByCategory(
				complianceData,
				category.key,
			),
		}),
	).filter((category) => category.documents.length > 0);

	if (categoriesWithDocuments.length === 0) {
		return (
			<div className="flex flex-col items-center gap-3 py-12 text-center">
				<FileTextIcon className="size-12 text-muted-foreground" />
				<p className="text-sm text-muted-foreground">No documents submitted</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{categoriesWithDocuments.map((category) => (
				<div key={category.key} className="space-y-3">
					<div>
						<h3 className="text-base font-semibold">{category.label}</h3>
						<p className="text-sm text-muted-foreground">{category.description}</p>
					</div>
					<div className="divide-y rounded-lg border">
						{category.documents.map((document, index) => (
							<div
								key={document.id ?? `${category.key}-${index}`}
								className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
							>
								<div className="min-w-0 space-y-1">
									<p className="truncate text-sm font-medium">
										{document.file_name ?? "Untitled document"}
									</p>
									<p className="text-xs text-muted-foreground">
										{formatComplianceFileSize(document.file_size)}
										{document.uploaded_at
											? ` · Uploaded ${new Date(document.uploaded_at).toLocaleDateString()}`
											: null}
									</p>
								</div>
								{document.url ? (
									<div className="flex flex-wrap gap-2">
										<Button variant="outline" size="sm" asChild>
											<a
												href={document.url}
												target="_blank"
												rel="noopener noreferrer"
											>
												<ArrowSquareOutIcon />
												View
											</a>
										</Button>
										<Button variant="outline" size="sm" asChild>
											<a href={document.url} download={document.file_name}>
												<DownloadSimpleIcon />
												Download
											</a>
										</Button>
									</div>
								) : null}
							</div>
						))}
					</div>
				</div>
			))}
		</div>
	);
}
