import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { V2AxiosError } from "#/api/http/shared";
import { useStartMixedVerificationV2Mutation } from "#/api/http/v2/verifications/verifications.hooks";
import type {
	MixedVerification,
	VerificationRequest,
} from "#/api/http/v2/verifications/verifications.types";
import { Button } from "@verifyafrica/ui/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@verifyafrica/ui/components/ui/dialog";
import { Input } from "@verifyafrica/ui/components/ui/input";
import { Label } from "@verifyafrica/ui/components/ui/label";
import { Skeleton } from "@verifyafrica/ui/components/ui/skeleton";
import { Textarea } from "@verifyafrica/ui/components/ui/textarea";
import { mixedVerificationRequiresAddress } from "../-data";

type StartMixedVerificationDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	template: MixedVerification | null;
	tenantId: string;
	onStarted: (verification: VerificationRequest, email: string) => void;
};

export function StartMixedVerificationDialog({
	open,
	onOpenChange,
	template,
	tenantId,
	onStarted,
}: StartMixedVerificationDialogProps) {
	const startMutation = useStartMixedVerificationV2Mutation();
	const [email, setEmail] = useState("");
	const [fullAddress, setFullAddress] = useState("");
	const requiresAddress = template
		? mixedVerificationRequiresAddress(template)
		: false;

	useEffect(() => {
		if (!open) {
			setEmail("");
			setFullAddress("");
		}
	}, [open]);

	async function handleStart() {
		if (!template) {
			return;
		}

		if (!email.trim()) {
			toast.error("Recipient email is required.");
			return;
		}

		if (requiresAddress && !fullAddress.trim()) {
			toast.error("Full address is required for this template.");
			return;
		}

		try {
			const verification = await startMutation.mutateAsync({
				tenantId,
				payload: {
					email: email.trim(),
					is_mixed: true,
					verification_id: template.id,
					full_address: requiresAddress ? fullAddress.trim() : undefined,
				},
			});
			onStarted(verification, email.trim());
			onOpenChange(false);
		} catch (error) {
			const message = (error as V2AxiosError).response?.data?.message;
			toast.error(message ?? "Failed to start mixed verification.");
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="font-semibold">
						Start Mixed Verification
					</DialogTitle>
					<DialogDescription>{template?.name}</DialogDescription>
				</DialogHeader>

				{startMutation.isPending ? (
					<div className="space-y-4">
						<div className="space-y-2">
							<Skeleton className="h-4 w-28" />
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-3 w-4/5" />
						</div>
						{requiresAddress ? (
							<div className="space-y-2">
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-24 w-full" />
							</div>
						) : null}
					</div>
				) : (
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="mixed-verification-email">Recipient Email</Label>
							<Input
								id="mixed-verification-email"
								type="email"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								placeholder="recipient@example.com"
							/>
							<p className="text-xs text-muted-foreground">
								The hosted verification link will be issued for this recipient.
							</p>
						</div>

						{requiresAddress && (
							<div className="space-y-2">
								<Label htmlFor="mixed-verification-address">Full Address</Label>
								<Textarea
									id="mixed-verification-address"
									value={fullAddress}
									onChange={(event) => setFullAddress(event.target.value)}
									placeholder="Enter the recipient's full address"
									rows={3}
								/>
							</div>
						)}
					</div>
				)}

				<DialogFooter>
					<Button
						type="button"
						variant="ghost"
						className="cursor-pointer tracking-wide"
						disabled={startMutation.isPending}
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button
						type="button"
						className="cursor-pointer tracking-wide"
						disabled={startMutation.isPending}
						onClick={() => void handleStart()}
					>
						{startMutation.isPending ? "Starting..." : "Start"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
