type InstructionArtProps = {
	className?: string;
};

export function FaceAlignArt({ className }: InstructionArtProps) {
	return (
		<svg viewBox="0 0 120 120" className={className} aria-hidden="true">
			<ellipse
				cx="60"
				cy="58"
				rx="34"
				ry="44"
				fill="#EEF4FF"
				stroke="#2F6FED"
				strokeWidth="3"
			/>
			<circle cx="60" cy="48" r="14" fill="#C9D8F5" />
			<path
				d="M38 92c6-16 38-16 44 0"
				fill="#9BB3E0"
			/>
			<circle cx="92" cy="92" r="12" fill="#2F9E6A" />
			<path
				d="M86 92.5l3.5 3.5 8-8"
				fill="none"
				stroke="white"
				strokeWidth="2.4"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

export function FaceLightingArt({ className }: InstructionArtProps) {
	return (
		<svg viewBox="0 0 120 120" className={className} aria-hidden="true">
			<ellipse
				cx="60"
				cy="58"
				rx="34"
				ry="44"
				fill="#F4F4F5"
				stroke="#D4D4D8"
				strokeWidth="3"
			/>
			<circle cx="60" cy="48" r="14" fill="#E4E4E7" />
			<path d="M38 92c6-16 38-16 44 0" fill="#D4D4D8" />
			<circle cx="78" cy="36" r="18" fill="white" opacity="0.85" />
			<circle cx="92" cy="92" r="12" fill="#DC2626" />
			<path
				d="M87 87l10 10M97 87l-10 10"
				stroke="white"
				strokeWidth="2.2"
				strokeLinecap="round"
			/>
		</svg>
	);
}

export function FaceAccessoriesArt({ className }: InstructionArtProps) {
	return (
		<svg viewBox="0 0 120 120" className={className} aria-hidden="true">
			<ellipse
				cx="60"
				cy="58"
				rx="34"
				ry="44"
				fill="#EEF4FF"
				stroke="#2F6FED"
				strokeWidth="3"
			/>
			<circle cx="60" cy="48" r="14" fill="#C9D8F5" />
			<path d="M38 92c6-16 38-16 44 0" fill="#9BB3E0" />
			<rect x="36" y="42" width="48" height="10" rx="5" fill="#52525B" />
			<circle cx="48" cy="47" r="8" fill="none" stroke="#52525B" strokeWidth="3" />
			<circle cx="72" cy="47" r="8" fill="none" stroke="#52525B" strokeWidth="3" />
			<circle cx="92" cy="92" r="12" fill="#DC2626" />
			<path
				d="M87 87l10 10M97 87l-10 10"
				stroke="white"
				strokeWidth="2.2"
				strokeLinecap="round"
			/>
		</svg>
	);
}
