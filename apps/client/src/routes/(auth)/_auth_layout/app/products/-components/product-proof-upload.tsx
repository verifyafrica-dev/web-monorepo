import { ProofFileUpload } from "#/components/ui-extended/proof-file-upload";
import { useCurrentTenant } from "../../team/-data";

import {
	type VerificationStorageName,
	UPLOAD_MAX_FILE_SIZE,
	uploadProductProofFile,
} from "../-upload-utils";

type ProductProofUploadProps = {
	/**
	 * Accessible field label shown above the dropzone.
	 */
	label: string;
	/**
	 * Product folder used when storing the file in tenant verification storage.
	 */
	verificationName: VerificationStorageName;
	/**
	 * Public URL of the last successful upload.
	 */
	proofUrl: string | null;
	/**
	 * Called with the uploaded URL, or `null` when the file is removed or upload fails.
	 */
	onProofUrlChange: (url: string | null) => void;
	/**
	 * Native `accept` attribute passed to the file input.
	 */
	accept?: string;
	/**
	 * MIME types allowed after the OS picker.
	 */
	allowedMimeTypes?: readonly string[];
	/**
	 * Maximum file size in bytes.
	 * @default 10485760 (10MB)
	 */
	maxSize?: number;
	/**
	 * Copy shown in the empty dropzone.
	 */
	emptyStateText: string;
	/**
	 * Disables picking, dropping, and removing files.
	 */
	disabled?: boolean;
	/**
	 * Called whenever the upload in-flight state changes.
	 */
	onUploadingChange?: (isUploading: boolean) => void;
};

/**
 * Tenant-scoped proof dropzone for dashboard product verifications.
 * Uploads to the current organization's verification storage folder.
 */
export function ProductProofUpload({
	label,
	verificationName,
	proofUrl,
	onProofUrlChange,
	accept,
	allowedMimeTypes,
	maxSize = UPLOAD_MAX_FILE_SIZE,
	emptyStateText,
	disabled = false,
	onUploadingChange,
}: ProductProofUploadProps) {
	const { tenantId, tenantSlug } = useCurrentTenant();

	return (
		<ProofFileUpload
			label={label}
			emptyStateText={emptyStateText}
			accept={accept}
			allowedMimeTypes={allowedMimeTypes}
			maxSize={maxSize}
			proofUrl={proofUrl}
			onProofUrlChange={onProofUrlChange}
			onUploadingChange={onUploadingChange}
			disabled={disabled}
			iconClassName="text-secondary"
			onUpload={async (file, { onProgress }) => {
				if (!tenantId || !tenantSlug) {
					throw new Error("Tenant is required to upload files.");
				}

				return uploadProductProofFile({
					file,
					tenantId,
					tenantSlug,
					verificationName,
					onProgress,
				});
			}}
		/>
	);
}
