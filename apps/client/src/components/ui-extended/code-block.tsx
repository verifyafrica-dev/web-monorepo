import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { themes } from "prism-react-renderer";
import { CodeBlock as ReactCodeBlock } from "react-code-block";

import { Button } from "@verifyafrica/ui/components/ui/button";
import { useClipboard } from "@verifyafrica/ui/hooks/use-clipboard";
import { cn } from "@verifyafrica/ui/lib/utils";

type CodeBlockProps = {
	code: string;
	language?: string;
	showLineNumbers?: boolean;
	wrap?: boolean;
	copyable?: boolean;
	copySuccessMessage?: string;
	className?: string;
	size?: "sm" | "xs";
};

export function CodeBlock({
	code,
	language = "json",
	showLineNumbers = false,
	wrap = false,
	copyable = false,
	copySuccessMessage = "Copied to clipboard",
	className,
	size = "sm",
}: CodeBlockProps) {
	const { copied, copy } = useClipboard({ successMessage: copySuccessMessage });

	return (
		<div className="group relative min-w-0">
			<ReactCodeBlock
				code={code}
				language={language}
				theme={themes.oneDark}
			>
				<ReactCodeBlock.Code
					className={cn(
						"overflow-auto rounded-lg bg-zinc-900 px-4 py-3 font-mono",
						size === "sm" ? "text-sm" : "text-xs",
						copyable && "pr-12",
						className,
					)}
				>
					<div className="flex">
						{showLineNumbers ? (
							<ReactCodeBlock.LineNumber className="min-w-[3ch] shrink-0 pr-4 text-right text-zinc-500 select-none" />
						) : null}
						<ReactCodeBlock.LineContent
							className={cn(
								"min-w-0 flex-1",
								wrap ? "break-all whitespace-pre-wrap" : "whitespace-pre",
							)}
						>
							<ReactCodeBlock.Token />
						</ReactCodeBlock.LineContent>
					</div>
				</ReactCodeBlock.Code>
			</ReactCodeBlock>
			{copyable ? (
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					className="absolute top-2 right-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
					onClick={() => void copy(code)}
					aria-label="Copy code"
				>
					{copied ? (
						<CheckIcon className="size-4 text-emerald-400" />
					) : (
						<CopyIcon className="size-4" />
					)}
				</Button>
			) : null}
		</div>
	);
}
