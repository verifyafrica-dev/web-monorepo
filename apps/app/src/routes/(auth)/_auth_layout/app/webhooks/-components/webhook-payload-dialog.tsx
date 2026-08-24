import type { TenantWebhookEvent } from "#/api/http/v2/tenants/tenants.types";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@verifyafrica/ui/components/ui/dialog";
import { formatWebhookEventDate } from "../-data";

type WebhookPayloadDialogProps = {
	event: TenantWebhookEvent | null;
	onOpenChange: (open: boolean) => void;
};

export function WebhookPayloadDialog({
	event,
	onOpenChange,
}: WebhookPayloadDialogProps) {
	return (
		<Dialog
			open={event !== null}
			onOpenChange={onOpenChange}
		>
			<DialogContent className="max-w-2xl sm:max-w-5xl">
				<DialogHeader>
					<DialogTitle className="font-semibold">Webhook payload</DialogTitle>
					<DialogDescription>
						{event
							? `${event.event} · ${formatWebhookEventDate(event.created_at)}`
							: "Outbound delivery payload"}
					</DialogDescription>
				</DialogHeader>
				<pre className="max-h-[60vh] overflow-auto rounded-lg bg-zinc-900 px-4 py-3 text-sm text-emerald-400">
					<code>
						{event?.payload
							? JSON.stringify(event.payload, null, 2)
							: "No payload stored for this delivery."}
					</code>
				</pre>
			</DialogContent>
		</Dialog>
	);
}
