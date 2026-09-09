import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@verifyafrica/ui/components/ui/dialog";

type ProofImagePreviewDialogProps = {
	src: string;
	alt: string;
	label: string;
	thumbnailClassName?: string;
};

export function ProofImagePreviewDialog({
	src,
	alt,
	label,
	thumbnailClassName,
}: ProofImagePreviewDialogProps) {
	return (
		<Dialog>
			<DialogTrigger asChild>
				<button
					type="button"
					className="cursor-zoom-in"
					aria-label={`Preview ${label} image in fullscreen`}
				>
					<img
						src={src}
						alt={alt}
						className={thumbnailClassName}
					/>
				</button>
			</DialogTrigger>
			<DialogContent
				className="flex max-h-[90dvh] min-w-1/2 max-w-8/10 flex-col overflow-hidden bg-background/95 p-4"
				showCloseButton
			>
				<DialogHeader className="shrink-0">
					<DialogTitle className="font-semibold">{label}</DialogTitle>
				</DialogHeader>
				<div className="min-h-0 flex-1 overflow-y-auto">
					<img
						src={src}
						alt={alt}
						className="h-auto w-full object-contain"
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
}
