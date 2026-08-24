import { useCallback, useState } from "react";
import { toast } from "sonner";
import { generatePDFWithColorSupport } from "#/lib/pdfHelpers";

const DEFAULT_SUPPORT_EMAIL = "support@verifyafrica.io";
const DEFAULT_BRAND_LOGO_SRC = "/assets/brand/logo.svg";

type UseBrandedPdfDownloadOptions = {
	supportEmail?: string;
	logoSrc?: string;
	errorMessage?: string;
};

type DownloadPdfOptions = {
	filename: string;
};

const applyBrandingToPdfClone = (
	clone: HTMLElement,
	{ supportEmail, logoSrc }: { supportEmail: string; logoSrc: string },
) => {
	const brandingHeader = document.createElement("div");
	brandingHeader.style.display = "flex";
	brandingHeader.style.alignItems = "center";
	brandingHeader.style.justifyContent = "flex-start";
	brandingHeader.style.paddingBottom = "12px";
	brandingHeader.style.marginBottom = "12px";
	brandingHeader.style.borderBottom = "1px solid rgba(21, 36, 46, 0.12)";

	const logo = document.createElement("img");
	logo.src = logoSrc;
	logo.alt = "VerifyAfrica";
	logo.style.height = "40px";
	logo.style.width = "auto";
	brandingHeader.appendChild(logo);

	const brandingFooter = document.createElement("div");
	brandingFooter.style.marginTop = "16px";
	brandingFooter.style.paddingTop = "12px";
	brandingFooter.style.borderTop = "1px solid rgba(21, 36, 46, 0.12)";
	brandingFooter.style.fontSize = "12px";
	brandingFooter.style.color = "#4b5563";

	const footerText = document.createElement("p");
	footerText.style.margin = "0";
	footerText.textContent = `Need help? Contact us: ${supportEmail}`;
	brandingFooter.appendChild(footerText);

	clone.prepend(brandingHeader);
	clone.appendChild(brandingFooter);
};

export const useBrandedPdfDownload = (
	targetRef: React.RefObject<HTMLElement | null>,
	options?: UseBrandedPdfDownloadOptions,
) => {
	const [isDownloading, setIsDownloading] = useState(false);
	const supportEmail = options?.supportEmail ?? DEFAULT_SUPPORT_EMAIL;
	const logoSrc = options?.logoSrc ?? DEFAULT_BRAND_LOGO_SRC;
	const errorMessage =
		options?.errorMessage ?? "Failed to download PDF. Please try again.";

	const downloadPdf = useCallback(
		async ({ filename }: DownloadPdfOptions) => {
			if (!targetRef.current) {
				return;
			}

			setIsDownloading(true);
			try {
				await generatePDFWithColorSupport(targetRef, {
					filename,
					onClone: (clone) => {
						applyBrandingToPdfClone(clone, { supportEmail, logoSrc });
					},
				});
			} catch {
				toast.error(errorMessage);
			} finally {
				setIsDownloading(false);
			}
		},
		[targetRef, supportEmail, logoSrc, errorMessage],
	);

	return {
		downloadPdf,
		isDownloading,
	};
};
