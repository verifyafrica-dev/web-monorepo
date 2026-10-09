import { cn } from "@verifyafrica/ui/lib/utils";
import { Highlight, themes } from "prism-react-renderer";
import { memo, useMemo, useState } from "react";

const LINE_HEIGHT_PX = 18;
const PADDING_Y_PX = 12;
const OVERSCAN_LINES = 40;
const VIEWPORT_HEIGHT_PX = 384;

type VirtualizedCodeBlockProps = {
	code: string;
	language?: string;
	className?: string;
};

/**
 * Renders and highlights only the lines in view, for code too large to tokenize
 * and mount at once. Lines don't wrap because every line must have a fixed
 * height, and the language must not have tokens that span lines (e.g. JSON).
 */
export const VirtualizedCodeBlock = memo(function VirtualizedCodeBlock({
	code,
	language = "json",
	className,
}: VirtualizedCodeBlockProps) {
	const lines = useMemo(() => code.split("\n"), [code]);
	const [firstVisibleLine, setFirstVisibleLine] = useState(0);

	const start = Math.max(0, firstVisibleLine - OVERSCAN_LINES);
	const end = Math.min(
		lines.length,
		firstVisibleLine +
			Math.ceil(VIEWPORT_HEIGHT_PX / LINE_HEIGHT_PX) +
			OVERSCAN_LINES,
	);
	const visibleCode = useMemo(
		() => lines.slice(start, end).join("\n"),
		[lines, start, end],
	);
	const gutterWidth = `${String(lines.length).length + 1}ch`;

	return (
		<div
			className={cn(
				"overflow-auto rounded-lg bg-zinc-900 font-mono text-xs",
				className,
			)}
			style={{ height: VIEWPORT_HEIGHT_PX }}
			onScroll={(event) => {
				const line = Math.floor(
					Math.max(0, event.currentTarget.scrollTop - PADDING_Y_PX) /
						LINE_HEIGHT_PX,
				);
				setFirstVisibleLine(line);
			}}
		>
			<div
				className="relative min-w-max"
				style={{ height: lines.length * LINE_HEIGHT_PX + PADDING_Y_PX * 2 }}
			>
				<Highlight
					code={visibleCode}
					language={language}
					theme={themes.oneDark}
				>
					{({ tokens, getLineProps, getTokenProps }) => (
						<div
							className="absolute inset-x-0 top-0 px-4"
							style={{
								transform: `translateY(${start * LINE_HEIGHT_PX + PADDING_Y_PX}px)`,
							}}
						>
							{tokens.map((line, index) => {
								const lineNumber = start + index + 1;
								const { className: lineClassName, ...lineProps } = getLineProps(
									{ line },
								);
								return (
									<div
										key={lineNumber}
										className="flex whitespace-pre"
										style={{
											height: LINE_HEIGHT_PX,
											lineHeight: `${LINE_HEIGHT_PX}px`,
										}}
									>
										<span
											className="shrink-0 pr-4 text-right text-zinc-500 select-none"
											style={{ minWidth: gutterWidth }}
										>
											{lineNumber}
										</span>
										<span {...lineProps} className={lineClassName}>
											{line.map((token, tokenIndex) => (
												<span
													// biome-ignore lint/suspicious/noArrayIndexKey: tokens are positional within a line
													key={tokenIndex}
													{...getTokenProps({ token })}
												/>
											))}
										</span>
									</div>
								);
							})}
						</div>
					)}
				</Highlight>
			</div>
		</div>
	);
});
