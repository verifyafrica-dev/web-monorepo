import {
	ArrowSquareOutIcon,
	CheckCircleIcon,
	DownloadSimpleIcon,
	FileDashedIcon,
	WarningCircleIcon,
} from "@phosphor-icons/react";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
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
	const categories = COMPLIANCE_DOCUMENT_CATEGORIES.map((category) => ({
		...category,
		documents: getComplianceDocumentsByCategory(complianceData, category.key),
	}));
	const providedCount = categories.filter(
		(category) => category.documents.length > 0,
	).length;
	const missingCount = categories.length - providedCount;

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
				<span className="font-medium">
					{providedCount} of {categories.length} document sections provided
				</span>
				{missingCount > 0 ? (
					<Badge
						variant="outline"
						className="border-amber-200 bg-amber-50 text-amber-700"
					>
						{missingCount} missing
					</Badge>
				) : (
					<Badge
						variant="outline"
						className="border-emerald-200 bg-emerald-50 text-emerald-700"
					>
						All provided
					</Badge>
				)}
			</div>

			{categories.map((category) => {
				const isProvided = category.documents.length > 0;

				return (
					<div key={category.key} className="space-y-3">
						<div className="flex flex-wrap items-start justify-between gap-2">
							<div>
								<h3 className="text-base font-semibold">{category.label}</h3>
								<p className="text-sm text-muted-foreground">
									{category.description}
								</p>
							</div>
							{isProvided ? (
								<Badge
									variant="outline"
									className="border-emerald-200 bg-emerald-50 text-emerald-700"
								>
									<CheckCircleIcon weight="fill" />
									{category.documents.length}{" "}
									{category.documents.length === 1 ? "document" : "documents"}
								</Badge>
							) : (
								<Badge
									variant="outline"
									className="border-amber-200 bg-amber-50 text-amber-700"
								>
									<WarningCircleIcon weight="fill" />
									Missing
								</Badge>
							)}
						</div>

						{isProvided ? (
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
						) : (
							<div className="flex items-center gap-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
								<FileDashedIcon className="size-5 shrink-0" />
								No document provided
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}
