import { FileIcon, FilePdfIcon } from "@phosphor-icons/react";
import { Button } from "@verifyafrica/ui/components/ui/button";

import type { SubmittedProof } from "./report-builders";
import { ReportDetailField } from "./report-detail-field";
import { ReportSectionCard } from "./report-sections";
import { ProofImagePreviewDialog } from "./verification-proofs/proof-image-preview-dialog";

function ProofPreview({ proof }: { proof: SubmittedProof }) {
	switch (proof.kind) {
		case "image":
			return (
				<ProofImagePreviewDialog
					src={proof.src}
					alt={proof.label}
					label={proof.label}
					thumbnailClassName="max-h-40 rounded-md border object-cover"
				/>
			);
		case "video":
			return (
				<video
					src={proof.src}
					controls
					className="max-w-full rounded-md border bg-black sm:max-w-xs"
				>
					<track kind="captions" />
				</video>
			);
		default:
			return (
				<Button variant="outline" size="sm" className="w-fit" asChild>
					<a href={proof.src} target="_blank" rel="noreferrer">
						{proof.kind === "pdf" ? <FilePdfIcon /> : <FileIcon />}
						{proof.kind === "pdf" ? "Open PDF" : "Open file"}
					</a>
				</Button>
			);
	}
}

export function SubmittedProofs({
	proofs,
	title = "Proofs",
}: {
	proofs: SubmittedProof[];
	title?: string;
}) {
	if (proofs.length === 0) return null;

	return (
		<ReportSectionCard title={title}>
			<div className="grid gap-4 sm:grid-cols-2">
				{proofs.map((proof) => (
					<ReportDetailField
						key={proof.key}
						label={proof.label}
						value={<ProofPreview proof={proof} />}
					/>
				))}
			</div>
		</ReportSectionCard>
	);
}
