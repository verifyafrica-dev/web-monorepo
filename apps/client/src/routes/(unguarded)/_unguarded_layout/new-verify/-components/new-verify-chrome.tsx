import { CopySimpleIcon, DeviceMobileIcon } from "@phosphor-icons/react";
import { QRCodeSVG } from "qrcode.react";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";

import { Button } from "@verifyafrica/ui/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@verifyafrica/ui/components/ui/dialog";
import { Field, FieldLabel } from "@verifyafrica/ui/components/ui/field";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@verifyafrica/ui/components/ui/tooltip";
import { Textarea } from "@verifyafrica/ui/components/ui/textarea";
import { useClipboard } from "@verifyafrica/ui/hooks/use-clipboard";
import { buildNewVerifyUrl } from "@verifyafrica/api-client/lib/verification-links";
import { cn } from "@verifyafrica/ui/lib/utils";

export const NEW_VERIFY_SUPPORT_EMAIL = "support@verifyafrica.io";

type NewVerifyChromeProps = {
	children: ReactNode;
	token: string;
};

export function NewVerifyBrandingFooter() {
	return (
		<footer className="flex flex-col items-center gap-2 px-5 py-4 text-center">
			<img
				src="/assets/brand/logo.svg"
				alt="VerifyAfrica"
				className="h-10 w-auto"
			/>
			<p className="text-xs text-muted-foreground">
				Contact VerifyAfrica{" "}
				<a
					href={`mailto:${NEW_VERIFY_SUPPORT_EMAIL}`}
					className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
				>
					{NEW_VERIFY_SUPPORT_EMAIL}
				</a>
			</p>
		</footer>
	);
}

export function NewVerifyChrome({ children, token }: NewVerifyChromeProps) {
	const [isHelpOpen, setIsHelpOpen] = useState(false);
	const [isContinueOnPhoneOpen, setIsContinueOnPhoneOpen] = useState(false);
	const [feedback, setFeedback] = useState("");
	const { copy } = useClipboard({ successMessage: "Link copied." });
	const continueOnPhoneUrl =
		typeof window === "undefined" ? "" : buildNewVerifyUrl(token);

	function handleSubmitFeedback() {
		setIsHelpOpen(false);
		setFeedback("");
		toast.success("Thanks for your feedback.");
	}

	return (
		<div className="flex min-h-dvh flex-col md:items-center">
			<div
				className={cn(
					"flex w-full flex-1 flex-col bg-white",
					"md:my-8 md:max-w-lg md:flex-none md:min-h-[min(52rem,calc(100dvh-4rem))] md:rounded-2xl md:shadow-[0_18px_60px_rgba(10,37,64,0.08)] md:ring-1 md:ring-black/5",
				)}
			>
				<header className="flex items-center justify-between gap-3 px-4 py-3 md:px-5">
					<img
						src="/assets/brand/logo.svg"
						alt="VerifyAfrica"
						className="h-10 w-auto"
					/>
					<div className="flex items-center gap-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="rounded-full"
							onClick={() => setIsContinueOnPhoneOpen(true)}
						>
							<DeviceMobileIcon
								className="size-4"
								weight="regular"
							/>
							Continue on Phone
						</Button>
						<Tooltip defaultOpen>
							<TooltipTrigger asChild>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="text-primary"
									onClick={() => setIsHelpOpen(true)}
								>
									Report
								</Button>
							</TooltipTrigger>
							<TooltipContent
								side="bottom"
								align="end"
								sideOffset={8}
								className="max-w-56 px-3 py-2 text-center text-pretty"
							>
								Click here to report an issue with your verification process
							</TooltipContent>
						</Tooltip>
					</div>
				</header>

				<div className="flex min-h-0 flex-1 flex-col">{children}</div>
				<NewVerifyBrandingFooter />
			</div>

			<Dialog
				open={isHelpOpen}
				onOpenChange={setIsHelpOpen}
			>
				<DialogContent className="gap-5 sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="text-xl font-semibold">
							Send Feedback
						</DialogTitle>
					</DialogHeader>
					<Field>
						<FieldLabel htmlFor="new-verify-feedback">
							How can we improve <span className="text-destructive">*</span>
						</FieldLabel>
						<Textarea
							id="new-verify-feedback"
							placeholder="Write here"
							value={feedback}
							onChange={(event) => setFeedback(event.target.value)}
							className="min-h-28 resize-none"
						/>
					</Field>
					<DialogFooter>
						<Button
							type="button"
							className="rounded-full px-5"
							disabled={feedback.trim().length === 0}
							onClick={handleSubmitFeedback}
						>
							Submit
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={isContinueOnPhoneOpen}
				onOpenChange={setIsContinueOnPhoneOpen}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader className="gap-2 text-left">
						<DialogTitle className="text-xl font-semibold">
							For the best experience, continue via mobile.
						</DialogTitle>
						<DialogDescription>
							We recommend scanning the QR code with your mobile for a quick and
							smooth verification process.
						</DialogDescription>
					</DialogHeader>
					<div className="flex flex-col items-center gap-5">
						{continueOnPhoneUrl ? (
							<div className="rounded-xl border border-border p-3">
								<QRCodeSVG
									value={continueOnPhoneUrl}
									size={180}
									level="M"
									imageSettings={{
										src: "/assets/brand/logo-square.svg",
										height: 40,
										width: 40,
										excavate: true,
									}}
								/>
							</div>
						) : null}
						<div className="flex w-full items-center gap-3">
							<div className="h-px flex-1 bg-border" />
							<span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
								OR
							</span>
							<div className="h-px flex-1 bg-border" />
						</div>
						<Button
							type="button"
							variant="outline"
							className="h-11 rounded-full px-5 cursor-pointer"
							onClick={() => void copy(continueOnPhoneUrl)}
							disabled={!continueOnPhoneUrl}
						>
							Copy link for other device
							<CopySimpleIcon
								className="size-4"
								weight="regular"
							/>
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
