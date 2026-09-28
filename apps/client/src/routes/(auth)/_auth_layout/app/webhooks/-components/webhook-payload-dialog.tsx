import { CodeBlock } from "#/components/ui-extended/code-block";
import type { TenantWebhookEvent } from "@verifyafrica/api-client/http/v2/tenants/tenants.types";
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
				{event?.payload ? (
					<CodeBlock
						code={JSON.stringify(event.payload, null, 2)}
						language="json"
						showLineNumbers
						copyable
						copySuccessMessage="Webhook payload copied."
						className="max-h-[60vh]"
					/>
				) : (
					<p className="rounded-lg bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
						No payload stored for this delivery.
					</p>
				)}
			</DialogContent>
		</Dialog>
	);
}
