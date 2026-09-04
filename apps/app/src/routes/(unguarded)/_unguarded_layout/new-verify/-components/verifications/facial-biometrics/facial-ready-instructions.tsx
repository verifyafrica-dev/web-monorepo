import { Button } from "@verifyafrica/ui/components/ui/button";

import {
	FaceAccessoriesArt,
	FaceAlignArt,
	FaceLightingArt,
} from "./facial-instruction-art";

const READY_ITEMS = [
	{
		label: "Align face within oval",
		Art: FaceAlignArt,
	},
	{
		label: "Avoid inappropriate lighting",
		Art: FaceLightingArt,
	},
	{
		label: "Remove accessories",
		Art: FaceAccessoriesArt,
	},
] as const;

type FacialReadyInstructionsProps = {
	onContinue: () => void;
	verificationMode?: "image_only" | "video_only";
};

export function FacialReadyInstructions({
	onContinue,
	verificationMode = "image_only",
}: FacialReadyInstructionsProps) {
	const isVideoMode = verificationMode === "video_only";

	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-8">
			<div className="max-w-md space-y-2 text-center">
				<h1 className="text-balance text-2xl font-semibold tracking-tight">
					Get ready to verify your face
				</h1>
				<p className="text-pretty text-sm text-muted-foreground">
					{isVideoMode
						? "You will record a 5 second video. Keep your face in the oval and avoid extra movement."
						: "Follow these steps so we can capture a clear biometric check."}
				</p>
			</div>
			<ul className="grid w-full max-w-md grid-cols-3 gap-4">
				{READY_ITEMS.map((item) => (
					<li key={item.label} className="flex flex-col items-center gap-2">
						<item.Art className="size-24" />
						<p className="text-center text-xs font-medium text-pretty leading-4">
							{item.label}
						</p>
					</li>
				))}
			</ul>
			<Button type="button" className="w-full max-w-md" onClick={onContinue}>
				Continue
			</Button>
		</div>
	);
}
