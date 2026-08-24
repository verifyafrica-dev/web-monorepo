import {
	CaretLeftIcon,
	CaretRightIcon,
	DownloadSimpleIcon,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";

import type { UploadedDocument } from "#/api/http/v1/kyc/kyc.types";
import { Button } from "@verifyafrica/ui/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@verifyafrica/ui/components/ui/dialog";
import { getDocumentPreviewType } from "../-upload-utils";

type KycDocumentPreviewDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	documents: UploadedDocument[];
	currentIndex: number;
	onNavigate?: (index: number) => void;
};

export function KycDocumentPreviewDialog({
	open,
	onOpenChange,
	documents,
	currentIndex,
	onNavigate,
}: KycDocumentPreviewDialogProps) {
	const document = documents[currentIndex];
	const [isLoading, setIsLoading] = useState(true);
	const [hasError, setHasError] = useState(false);

	useEffect(() => {
		if (open) {
			setIsLoading(true);
			setHasError(false);
		}
	}, [open]);

	if (!document) {
		return null;
	}

	const previewType = getDocumentPreviewType(document.file_type);
	const canGoPrev = currentIndex > 0;
	const canGoNext = currentIndex < documents.length - 1;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
				<DialogHeader className="flex flex-row items-center justify-between gap-3 border-b px-4 py-3">
					<div className="flex min-w-0 flex-1 items-center gap-2">
						{documents.length > 1 && (
							<>
								<Button
									type="button"
									variant="ghost"
									size="icon-xs"
									disabled={!canGoPrev}
									onClick={() => onNavigate?.(currentIndex - 1)}
									aria-label="Previous document"
								>
									<CaretLeftIcon className="size-4" />
								</Button>
								<Button
									type="button"
									variant="ghost"
									size="icon-xs"
									disabled={!canGoNext}
									onClick={() => onNavigate?.(currentIndex + 1)}
									aria-label="Next document"
								>
									<CaretRightIcon className="size-4" />
								</Button>
							</>
						)}
						<div className="min-w-0">
							<DialogTitle className="truncate text-base">
								{document.file_name}
							</DialogTitle>
							{documents.length > 1 && (
								<p className="text-xs text-muted-foreground">
									Document {currentIndex + 1} of {documents.length}
								</p>
							)}
						</div>
					</div>
					<Button asChild variant="outline" size="sm">
						<a href={document.url} download={document.file_name}>
							<DownloadSimpleIcon className="size-4" />
							Download
						</a>
					</Button>
				</DialogHeader>

				<div className="relative flex min-h-[60vh] flex-1 items-center justify-center bg-muted/30 p-4">
					{isLoading && !hasError && (
						<p className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
							Loading preview...
						</p>
					)}

					{hasError && (
						<p className="text-sm text-destructive">
							Failed to load preview. Try downloading the file instead.
						</p>
					)}

					{previewType === "pdf" ? (
						<iframe
							src={document.url}
							title={document.file_name}
							className="h-[70vh] w-full rounded-md border bg-background"
							onLoad={() => {
								setIsLoading(false);
								setHasError(false);
							}}
							onError={() => {
								setIsLoading(false);
								setHasError(true);
							}}
						/>
					) : (
						<img
							src={document.url}
							alt={document.file_name}
							className="max-h-[70vh] max-w-full rounded-md object-contain"
							onLoad={() => {
								setIsLoading(false);
								setHasError(false);
							}}
							onError={() => {
								setIsLoading(false);
								setHasError(true);
							}}
						/>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
