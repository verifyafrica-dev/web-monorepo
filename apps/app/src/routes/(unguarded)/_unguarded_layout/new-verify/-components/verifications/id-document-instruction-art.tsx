import type { ReactNode } from "react";

type InstructionArtProps = {
	className?: string;
};

export function InstructionHeroArt({ className }: InstructionArtProps) {
	return (
		<svg
			viewBox="0 0 180 120"
			className={className}
			aria-hidden="true"
		>
			<path
				d="M28 78c18-22 38-18 52 4 16-28 40-24 72 10"
				fill="none"
				stroke="#F5C451"
				strokeWidth="10"
				strokeLinecap="round"
			/>
			<rect
				x="46"
				y="22"
				width="88"
				height="58"
				rx="10"
				fill="#EEF4FF"
				stroke="#2F6FED"
				strokeWidth="2.5"
			/>
			<rect
				x="56"
				y="32"
				width="22"
				height="26"
				rx="4"
				fill="#C9D8F5"
			/>
			<circle
				cx="67"
				cy="40"
				r="5"
				fill="#6B8FD4"
			/>
			<rect
				x="86"
				y="34"
				width="36"
				height="4"
				rx="2"
				fill="#9BB3E0"
			/>
			<rect
				x="86"
				y="42"
				width="28"
				height="3"
				rx="1.5"
				fill="#C5D4EE"
			/>
			<rect
				x="86"
				y="48"
				width="32"
				height="3"
				rx="1.5"
				fill="#C5D4EE"
			/>
			<circle
				cx="122"
				cy="76"
				r="11"
				fill="#2F9E6A"
			/>
			<path
				d="M116 76.5l3.5 3.5 8-8"
				fill="none"
				stroke="white"
				strokeWidth="2.4"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

function AvoidCard({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<svg
			viewBox="0 0 88 64"
			className={className}
			aria-hidden="true"
		>
			{children}
			<circle
				cx="74"
				cy="50"
				r="9"
				fill="#E24B4A"
			/>
			<path
				d="M70.5 46.5l7 7M77.5 46.5l-7 7"
				stroke="white"
				strokeWidth="2"
				strokeLinecap="round"
			/>
		</svg>
	);
}

export function InstructionAvoidGlareArt({ className }: InstructionArtProps) {
	return (
		<AvoidCard className={className}>
			<rect
				x="8"
				y="8"
				width="56"
				height="38"
				rx="6"
				fill="#F3F6FB"
				stroke="#C9D4E5"
			/>
			<rect
				x="14"
				y="14"
				width="14"
				height="16"
				rx="3"
				fill="#D7E0EE"
			/>
			<path
				d="M40 12l18 10-10 18"
				fill="#F8FBFF"
				opacity="0.9"
			/>
		</AvoidCard>
	);
}

export function InstructionAvoidExpiredArt({ className }: InstructionArtProps) {
	return (
		<AvoidCard className={className}>
			<rect
				x="8"
				y="8"
				width="56"
				height="38"
				rx="6"
				fill="#F3F6FB"
				stroke="#C9D4E5"
			/>
			<rect
				x="14"
				y="14"
				width="14"
				height="16"
				rx="3"
				fill="#D7E0EE"
			/>
			<rect
				x="32"
				y="16"
				width="24"
				height="3"
				rx="1.5"
				fill="#B7C5D8"
			/>
			<rect
				x="32"
				y="22"
				width="18"
				height="3"
				rx="1.5"
				fill="#D0DBE8"
			/>
		</AvoidCard>
	);
}

export function InstructionAvoidBlurArt({ className }: InstructionArtProps) {
	return (
		<AvoidCard className={className}>
			<rect
				x="8"
				y="8"
				width="56"
				height="38"
				rx="6"
				fill="#F3F6FB"
				stroke="#C9D4E5"
			/>
			<rect
				x="14"
				y="14"
				width="14"
				height="16"
				rx="3"
				fill="#D7E0EE"
				opacity="0.55"
			/>
			<rect
				x="32"
				y="16"
				width="24"
				height="3"
				rx="1.5"
				fill="#B7C5D8"
				opacity="0.5"
			/>
			<rect
				x="32"
				y="22"
				width="18"
				height="3"
				rx="1.5"
				fill="#D0DBE8"
				opacity="0.45"
			/>
		</AvoidCard>
	);
}

export function InstructionAvoidDistantArt({ className }: InstructionArtProps) {
	return (
		<AvoidCard className={className}>
			<rect
				x="8"
				y="10"
				width="56"
				height="34"
				rx="6"
				fill="#EEF2F7"
				stroke="#C9D4E5"
			/>
			<rect
				x="28"
				y="18"
				width="22"
				height="16"
				rx="3"
				fill="#F8FBFF"
				stroke="#9AAFCB"
			/>
			<path
				d="M24 38c6-4 12-4 18 0"
				fill="none"
				stroke="#9AAFCB"
				strokeWidth="2"
			/>
		</AvoidCard>
	);
}
