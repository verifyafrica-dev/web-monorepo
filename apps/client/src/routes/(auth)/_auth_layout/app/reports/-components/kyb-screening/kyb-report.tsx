import type { VerificationRequestDetail } from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
import { useEffect, useMemo, useState } from "react";

import { KybCompanyAccordion } from "./kyb-company-accordion";
import { KybScreeningInput } from "./kyb-screening-input";
import { KybScreeningOutcome } from "./kyb-screening-outcome";
import {
	buildKybInputFields,
	buildKybOutcome,
	getKybCompanies,
	type KybCompanySummary,
} from "./kyb-screening-sections";

function getHashCompanyKey() {
	return typeof window === "undefined"
		? undefined
		: decodeURIComponent(window.location.hash.slice(1)) || undefined;
}

function getCompanyHref(company: KybCompanySummary) {
	const url = new URL(window.location.href);
	url.hash = company.key;
	return url.toString();
}

export function KybReport({
	verification,
}: {
	verification: VerificationRequestDetail;
}) {
	const inputFields = useMemo(
		() => buildKybInputFields(verification.input_data),
		[verification.input_data],
	);
	const companies = useMemo(
		() => getKybCompanies(verification.response_data),
		[verification.response_data],
	);
	const outcome = useMemo(
		() => buildKybOutcome(verification.response_data, companies),
		[verification.response_data, companies],
	);

	const [openKeys, setOpenKeys] = useState<string[]>(() =>
		companies[0] ? [companies[0].key] : [],
	);

	// The hash is only readable on the client, so apply it after hydration.
	useEffect(() => {
		const hashKey = getHashCompanyKey();
		const linked = companies.find((company) => company.key === hashKey);
		if (!linked) return;
		setOpenKeys([linked.key]);
		const frame = requestAnimationFrame(() => {
			document
				.getElementById(linked.key)
				?.scrollIntoView({ behavior: "smooth", block: "start" });
		});
		return () => cancelAnimationFrame(frame);
	}, [companies]);

	return (
		<div className="flex flex-col gap-6">
			<KybScreeningInput fields={inputFields} />
			<KybScreeningOutcome outcome={outcome} />
			<KybCompanyAccordion
				companies={companies}
				openKeys={openKeys}
				onOpenKeysChange={setOpenKeys}
				getCompanyHref={getCompanyHref}
			/>
		</div>
	);
}
