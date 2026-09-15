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

const MAX_JSON_STRING_LENGTH = 2_000;

function jsonReplacer(_key: string, value: unknown) {
	if (typeof value === "bigint") {
		return value.toString();
	}

	if (typeof value === "string" && value.length > MAX_JSON_STRING_LENGTH) {
		return `${value.slice(0, MAX_JSON_STRING_LENGTH)}… [truncated ${value.length} chars]`;
	}

	return value;
}

function serializeVerification(verification: VerificationRequestDetail) {
	const payload = {
		id: verification.id,
		verification_type: verification.verification_type,
		status: verification.status,
		reference: verification.reference,
		input_data: verification.input_data,
		response_data: verification.response_data ?? {},
		cost_charged: verification.cost_charged,
		currency: verification.currency,
		created_at: verification.created_at,
		submitted_at: verification.submitted_at,
		batch_id: verification.batch_id,
		source: verification.source,
		link: verification.link,
		email_sent_at: verification.email_sent_at,
		by_api: verification.by_api,
		api_key_id: verification.api_key_id,
		proofs_available: verification.proofs_available,
		proofs: verification.proofs,
	};

	try {
		return JSON.stringify(payload, jsonReplacer, 2);
	} catch (error) {
		try {
			return JSON.stringify(
				{
					id: verification.id,
					verification_type: verification.verification_type,
					status: verification.status,
					response_data: verification.response_data ?? {},
					serialize_error:
						error instanceof Error
							? error.message
							: "Unable to serialize JSON",
				},
				jsonReplacer,
				2,
			);
		} catch {
			return JSON.stringify(
				{
					id: verification.id,
					verification_type: verification.verification_type,
					status: verification.status,
					serialize_error: "Unable to serialize JSON",
				},
				null,
				2,
			);
		}
	}
}

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
	const json = useMemo(() => {
		if (!expanded) {
			return "";
		}
		return serializeVerification(verification);
	}, [expanded, verification]);

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
					onClick={() => {
						const payload = json || serializeVerification(verification);
						void copy(payload);
					}}
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
					<pre className="max-h-96 overflow-auto rounded-md border bg-muted/30 p-3 font-mono text-xs whitespace-pre-wrap break-all">
						{json}
					</pre>
				</CardContent>
			) : null}
		</Card>
	);
}
