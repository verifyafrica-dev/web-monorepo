import { CameraIcon } from "@phosphor-icons/react";
import { toast } from "sonner";

import {
	useTenantProductSettingsV2Query,
	useUpdateTenantProductSettingsV2Mutation,
} from "#/api/http/v2/tenants/tenants.hooks";
import type { HostedCaptureVerificationType } from "#/api/http/v2/tenants/tenants.types";
import type { V2AxiosError } from "@verifyafrica/api-client/http/shared";
import { Label } from "@verifyafrica/ui/components/ui/label";
import { Skeleton } from "@verifyafrica/ui/components/ui/skeleton";
import { Switch } from "@verifyafrica/ui/components/ui/switch";
import { useCurrentTenant } from "../../team/-data";

type ProductFileUploadSettingSectionProps = {
	verificationType: HostedCaptureVerificationType;
};

export function ProductFileUploadSettingSection({
	verificationType,
}: ProductFileUploadSettingSectionProps) {
	const { tenantId, isTenantAdmin } = useCurrentTenant();
	const settingsQuery = useTenantProductSettingsV2Query(
		tenantId,
		Boolean(tenantId),
	);
	const updateMutation = useUpdateTenantProductSettingsV2Mutation(
		tenantId ?? "",
	);

	const allowFileUpload =
		settingsQuery.data?.settings.find(
			(row) => row.verification_type === verificationType,
		)?.allow_file_upload ?? true;

	async function handleChange(checked: boolean) {
		if (!tenantId || !isTenantAdmin) {
			return;
		}

		try {
			await updateMutation.mutateAsync({
				verification_type: verificationType,
				allow_file_upload: checked,
			});
			toast.success(
				checked
					? "Customers can capture with camera or upload a file."
					: "Customers must capture with the camera only.",
			);
		} catch (error) {
			const axiosError = error as V2AxiosError;
			toast.error(
				axiosError.response?.data?.message ??
					"Failed to update file upload setting.",
			);
		}
	}

	return (
		<section className="space-y-3">
			<h2 className="text-sm font-semibold text-secondary">Link capture</h2>
			<div className="flex items-start justify-between gap-3">
				<div className="flex min-w-0 items-start gap-2.5">
					<CameraIcon
						className="mt-0.5 size-4 shrink-0 text-secondary"
						weight="duotone"
					/>
					<div className="min-w-0 space-y-1">
						<Label
							htmlFor={`allow-file-upload-${verificationType}`}
							className="text-sm font-medium text-pretty"
						>
							Allow file upload
						</Label>
						<p className="text-sm leading-relaxed text-muted-foreground text-pretty">
							When on, link-mode customers can use the camera or upload a file.
							When off, only camera capture is accepted.
						</p>
					</div>
				</div>
				{settingsQuery.isPending ? (
					<Skeleton className="h-6 w-10 shrink-0 rounded-full" />
				) : (
					<Switch
						id={`allow-file-upload-${verificationType}`}
						checked={allowFileUpload}
						onCheckedChange={(checked) => void handleChange(checked)}
						disabled={!isTenantAdmin || updateMutation.isPending}
						className="shrink-0"
					/>
				)}
			</div>
		</section>
	);
}
