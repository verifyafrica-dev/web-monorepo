import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { Alert, AlertDescription, AlertTitle } from "@verifyafrica/ui/components/ui/alert";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { useClipboard } from "@verifyafrica/ui/hooks/use-clipboard";
import { getWebhookEndpointUrls } from "../-data";

function WebhookEndpointRow({ label, url }: { label: string; url: string }) {
	const { copied, copy } = useClipboard({
		successMessage: `${label} webhook URL copied`,
		errorMessage: "Failed to copy webhook URL",
	});

	return (
		<div className="space-y-2">
			<p className="text-xs font-medium uppercase tracking-wide text-blue-800/80">
				{label}
			</p>
			<div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2">
				<code className="flex-1 break-all font-mono text-sm text-foreground">
					{url}
				</code>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					onClick={() => void copy(url)}
					title={copied ? "Copied" : "Copy to clipboard"}
				>
					{copied ? (
						<CheckIcon className="size-4 text-emerald-600" />
					) : (
						<CopyIcon className="size-4" />
					)}
				</Button>
			</div>
		</div>
	);
}

export function WebhookEndpointCard() {
	const endpoints = getWebhookEndpointUrls();

	return (
		<Alert className="border-blue-200 bg-blue-50 text-blue-950">
			<AlertTitle className="text-sm font-semibold">
				Webhook Endpoints
			</AlertTitle>
			<AlertDescription className="mt-3 space-y-4">
				<WebhookEndpointRow label="Stripe" url={endpoints.stripe} />
				<WebhookEndpointRow label="Shufti" url={endpoints.shufti} />
			</AlertDescription>
		</Alert>
	);
}
