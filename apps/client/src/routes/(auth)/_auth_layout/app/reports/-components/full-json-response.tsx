import { CaretDownIcon, CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";

import type { VerificationRequestDetail } from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
import { Button } from "@verifyafrica/ui/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@verifyafrica/ui/components/ui/card";
import { useClipboard } from "@verifyafrica/ui/hooks/use-clipboard";
import { cn } from "@verifyafrica/ui/lib/utils";

export function FullJsonResponse({
	verification,
}: {
	verification: VerificationRequestDetail;
}) {
	const [expanded, setExpanded] = useState(false);
	const { copied, copy } = useClipboard({
		successMessage: "JSON response copied.",
		errorMessage: "Unable to copy JSON response.",
	});
	const json = useMemo(
		() => JSON.stringify(verification, null, 2),
		[verification],
	);

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
				<button
					type="button"
					className="flex min-w-0 flex-1 items-center gap-2 text-left"
					onClick={() => setExpanded((previous) => !previous)}
					aria-expanded={expanded}
				>
					<CardTitle className="text-base font-semibold">
						Full JSON Response
					</CardTitle>
					<CaretDownIcon
						className={cn(
							"size-4 shrink-0 text-muted-foreground transition-transform",
							expanded && "rotate-180",
						)}
					/>
				</button>
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="shrink-0"
					onClick={() => void copy(json)}
					aria-label="Copy JSON response"
				>
					{copied ? (
						<CheckIcon className="size-4 text-emerald-600" />
					) : (
						<CopyIcon className="size-4" />
					)}
					{copied ? "Copied" : "Copy"}
				</Button>
			</CardHeader>
			{expanded ? (
				<CardContent className="pt-0">
					<pre className="max-h-96 overflow-auto rounded-md border bg-muted/30 p-3 font-mono text-xs">
						{json}
					</pre>
				</CardContent>
			) : null}
		</Card>
	);
}
