import type { VerificationRequestDetail } from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
import { useEffect, useMemo, useState } from "react";

import { useScrollToElement } from "../report-card-selector";
import { KYB_COMPANIES_SECTION_ID, KybCompanyList } from "./kyb-company-list";
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

	const [selectedKey, setSelectedKey] = useState<string>();
	const scrollTo = useScrollToElement();

	// The hash is only readable on the client, so apply it after hydration.
	useEffect(() => {
		const hashKey = getHashCompanyKey();
		const linked = companies.find((company) => company.key === hashKey);
		if (!linked) return;
		setSelectedKey(linked.key);
		scrollTo(KYB_COMPANIES_SECTION_ID);
	}, [companies, scrollTo]);

	return (
		<div className="flex flex-col gap-6">
			<KybScreeningInput fields={inputFields} />
			<KybScreeningOutcome outcome={outcome} />
			<KybCompanyList
				companies={companies}
				selectedKey={selectedKey}
				onSelect={(company) => {
					setSelectedKey(company.key);
					scrollTo(KYB_COMPANIES_SECTION_ID);
				}}
				onBack={(company) => {
					setSelectedKey(undefined);
					scrollTo(company.key);
				}}
				getCompanyHref={getCompanyHref}
			/>
		</div>
	);
}
