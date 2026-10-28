import { WarningCircleIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { V2AxiosError } from "@verifyafrica/api-client/http/shared";
import { useStartMixedVerificationV2Mutation } from "#/api/http/v2/verifications/verifications.hooks";
import type {
	MixedVerification,
	MixedVerificationAvailabilityCatalog,
	MixedVerificationAvailabilityReason,
	MixedVerificationSession,
} from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
import { resolveMixedTemplateAvailability } from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@verifyafrica/ui/components/ui/select";
import { Skeleton } from "@verifyafrica/ui/components/ui/skeleton";
import { Textarea } from "@verifyafrica/ui/components/ui/textarea";
import {
	DEFAULT_VERIFICATION_URL_LIMIT,
	VERIFICATION_URL_LIMITS,
} from "../../../-components/VerificationConsentCheckbox/data";
import { PRODUCT_SLUG } from "../../-data";
import {
	ProductDisabledNotice,
	useIsProductDisabled,
} from "../../-product-access";
import { formatVerificationTypeLabel, mixedVerificationRequiresAddress } from "../-data";

type StartMixedVerificationDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	template: MixedVerification | null;
	tenantId: string;
	availabilityCatalog?: MixedVerificationAvailabilityCatalog | null;
	onStarted: (session: MixedVerificationSession, email: string) => void;
};

function UnavailableNotice({
	reasons,
}: {
	reasons: MixedVerificationAvailabilityReason[];
}) {
	return (
		<div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950">
			<div className="flex items-start gap-2 font-medium">
				<WarningCircleIcon className="mt-0.5 size-4 shrink-0" />
				<span>This verification is currently unavailable</span>
			</div>
			<ul className="list-disc space-y-1 pl-5 text-xs">
				{reasons.map((reason) => (
					<li key={`${reason.code}-${reason.verification_type}-${reason.message}`}>
						{reason.verification_type
							? `${formatVerificationTypeLabel(reason.verification_type)}: `
							: ""}
						{reason.message}
					</li>
				))}
			</ul>
			<p className="text-xs text-amber-900/80">
				You can still edit the template, but verification links cannot be created
				until every step is available again.
			</p>
		</div>
	);
}

export function StartMixedVerificationDialog({
	open,
	onOpenChange,
	template,
	tenantId,
	availabilityCatalog,
	onStarted,
}: StartMixedVerificationDialogProps) {
	const startMutation = useStartMixedVerificationV2Mutation();
	const isProductDisabled = useIsProductDisabled(
		PRODUCT_SLUG.MIXED_VERIFICATIONS,
	);
	const [email, setEmail] = useState("");
	const [fullAddress, setFullAddress] = useState("");
	const [urlLimit, setUrlLimit] = useState(DEFAULT_VERIFICATION_URL_LIMIT);
	const requiresAddress = template
		? mixedVerificationRequiresAddress(template)
		: false;
	const resolvedAvailability = template
		? resolveMixedTemplateAvailability(template, availabilityCatalog)
		: { available: true, reasons: [] as MixedVerificationAvailabilityReason[] };
	const isUnavailable = !resolvedAvailability.available;
	const availabilityReasons = resolvedAvailability.reasons;
	const canStart =
		Boolean(template?.is_active) && !isProductDisabled && !isUnavailable;

	useEffect(() => {
		if (!open) {
			setEmail("");
			setFullAddress("");
			setUrlLimit(DEFAULT_VERIFICATION_URL_LIMIT);
		}
	}, [open]);

	async function handleStart() {
		if (!template) {
			return;
		}

		if (isUnavailable || isProductDisabled) {
			toast.error("This mixed verification is currently unavailable.");
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
			const session = await startMutation.mutateAsync({
				tenantId,
				payload: {
					email: email.trim(),
					is_mixed: true,
					verification_id: template.id,
					full_address: requiresAddress ? fullAddress.trim() : undefined,
					ttl: Number(urlLimit),
				},
			});
			onStarted(session, email.trim());
			onOpenChange(false);
		} catch (error) {
			const data = (error as V2AxiosError).response?.data as
				| {
						message?: string;
						errors?: unknown;
						data?: {
							availability_reasons?: MixedVerificationAvailabilityReason[];
						};
				  }
				| undefined;
			const reasons =
				(data as { availability_reasons?: MixedVerificationAvailabilityReason[] })
					?.availability_reasons ??
				data?.data?.availability_reasons;
			if (reasons?.length) {
				toast.error(
					reasons.map((reason) => reason.message).join(" · ") ||
						"This mixed verification is currently unavailable.",
				);
				return;
			}
			toast.error(data?.message ?? "Failed to start mixed verification.");
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

				{isUnavailable ? (
					<UnavailableNotice reasons={availabilityReasons} />
				) : null}
				{isProductDisabled ? <ProductDisabledNotice /> : null}

				{!isUnavailable && !isProductDisabled ? (
					startMutation.isPending ? (
						<div className="space-y-4">
							<div className="space-y-2">
								<Skeleton className="h-4 w-28" />
								<Skeleton className="h-10 w-full" />
								<Skeleton className="h-3 w-4/5" />
							</div>
							<div className="space-y-2">
								<Skeleton className="h-4 w-36" />
								<Skeleton className="h-10 w-full" />
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

							<div className="space-y-2">
								<Label htmlFor="mixed-verification-url-limit">
									Verification URL Limit
								</Label>
								<Select value={urlLimit} onValueChange={setUrlLimit}>
									<SelectTrigger
										id="mixed-verification-url-limit"
										className="w-full"
									>
										<SelectValue placeholder="Select duration" />
									</SelectTrigger>
									<SelectContent>
										{VERIFICATION_URL_LIMITS.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<p className="text-xs text-muted-foreground">
									All steps must be completed before the link expires.
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
					)
				) : null}

				<DialogFooter>
					<Button
						type="button"
						variant="ghost"
						className="cursor-pointer tracking-wide"
						disabled={startMutation.isPending}
						onClick={() => onOpenChange(false)}
					>
						{isUnavailable || isProductDisabled ? "Close" : "Cancel"}
					</Button>
					{canStart ? (
						<Button
							type="button"
							className="cursor-pointer tracking-wide"
							disabled={startMutation.isPending}
							onClick={() => void handleStart()}
						>
							{startMutation.isPending ? "Starting..." : "Start"}
						</Button>
					) : null}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
