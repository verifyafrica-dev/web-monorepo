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
				className=" bg-background/95 p-4"
				showCloseButton
			>
				<DialogHeader>
					<DialogTitle className="font-semibold">{label}</DialogTitle>
				</DialogHeader>
				<div className="flex h-full items-center justify-center overflow-auto pb-6">
					<img
						src={src}
						alt={alt}
						className="max-h-full max-w-full object-contain"
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
}
