import { BuildingsIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useState } from "react";

import { CreateOrganizationDialog } from "#/components/create-organization-dialog";
import { Button } from "@verifyafrica/ui/components/ui/button";

const SUPPORT_EMAIL = "support@verifyafrica.io";

type NoOrganizationStateProps = {
	onCreated?: (tenantId: string) => void;
};

export function NoOrganizationState({ onCreated }: NoOrganizationStateProps) {
	const [createOpen, setCreateOpen] = useState(false);

	return (
		<div className="flex min-h-[60vh] flex-1 items-center justify-center px-4 py-12">
			<div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
				<WarningCircleIcon
					className="size-14 text-primary"
					weight="regular"
				/>
				<div className="flex flex-col gap-2">
					<h1 className="text-2xl font-semibold tracking-tight">
						Account membership deactivated
					</h1>
					<p className="text-sm leading-relaxed text-muted-foreground">
						Your access to the previous organization is no longer active. Please
						contact{" "}
						<a
							href={`mailto:${SUPPORT_EMAIL}`}
							className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
						>
							{SUPPORT_EMAIL}
						</a>{" "}
						for help, or create your own organization to continue.
					</p>
				</div>
				<div className="mt-2 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
					<Button
						type="button"
						className="cursor-pointer"
						onClick={() => setCreateOpen(true)}
					>
						<BuildingsIcon className="size-4" weight="bold" />
						Create organization
					</Button>
					<Button type="button" variant="outline" asChild>
						<a href={`mailto:${SUPPORT_EMAIL}`}>Contact support</a>
					</Button>
				</div>
			</div>

			<CreateOrganizationDialog
				open={createOpen}
				onOpenChange={setCreateOpen}
				onCreated={onCreated}
			/>
		</div>
	);
}
