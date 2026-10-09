import { BuildingsIcon } from "@phosphor-icons/react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@verifyafrica/ui/components/ui/accordion";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { cn } from "@verifyafrica/ui/lib/utils";

import { asUnknownArray } from "../../-utils";
import { ReportSectionCard } from "../report-sections";
import { KybCompanyDetail } from "./kyb-company-detail";
import { KybRegistryBadge } from "./kyb-registry-badge";
import type { KybCompanySummary } from "./kyb-screening-sections";

function pluralize(count: number, noun: string) {
	return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function companyHighlights(company: KybCompanySummary) {
	const officers = asUnknownArray(company.raw.company_officers).length;
	const owners = asUnknownArray(
		company.raw.company_ultimate_beneficial_owners,
	).length;
	const announcements = asUnknownArray(
		company.raw.annoucements_detail ?? company.raw.announcements_detail,
	).length;

	return [
		officers > 0 ? pluralize(officers, "officer") : null,
		owners > 0 ? pluralize(owners, "owner") : null,
		announcements > 0 ? pluralize(announcements, "announcement") : null,
	].filter((item): item is string => Boolean(item));
}

function CompanySummary({ company }: { company: KybCompanySummary }) {
	const highlights = companyHighlights(company);
	const meta = [
		company.registrationNumber,
		company.jurisdiction,
		company.registrationDate ? `Registered ${company.registrationDate}` : null,
	].filter(Boolean);

	return (
		<div className="flex min-w-0 flex-1 items-start gap-3">
			<span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
				<BuildingsIcon className="size-5" />
			</span>
			<div className="flex min-w-0 flex-1 flex-col gap-2">
				<div className="min-w-0">
					<p className="text-sm font-medium text-pretty">{company.name}</p>
					{meta.length > 0 ? (
						<p className="text-xs font-normal text-muted-foreground break-words">
							{meta.join(" · ")}
						</p>
					) : null}
				</div>
				{company.status || company.registries.length > 0 ? (
					<div className="flex flex-wrap gap-1">
						{company.status ? (
							<Badge
								variant="outline"
								className={cn(
									company.status === "Dissolved" &&
										"border-red-200 bg-red-50 text-red-700",
								)}
							>
								{company.status}
								{company.dissolutionDate
									? ` · ${company.dissolutionDate}`
									: null}
							</Badge>
						) : null}
						{company.registries.map((registry) => (
							<KybRegistryBadge key={registry.name} registry={registry} />
						))}
					</div>
				) : null}
				{highlights.length > 0 ? (
					<p className="text-xs font-normal text-muted-foreground">
						{highlights.join(" · ")}
					</p>
				) : null}
			</div>
		</div>
	);
}

export function KybCompanyAccordion({
	companies,
	openKeys,
	onOpenKeysChange,
	getCompanyHref,
}: {
	companies: KybCompanySummary[];
	openKeys: string[];
	onOpenKeysChange: (keys: string[]) => void;
	getCompanyHref: (company: KybCompanySummary) => string;
}) {
	if (companies.length === 0) return null;

	return (
		<ReportSectionCard title={`Matched Companies (${companies.length})`}>
			<Accordion
				type="multiple"
				value={openKeys}
				onValueChange={onOpenKeysChange}
				className="gap-3"
			>
				{companies.map((company) => (
					<AccordionItem
						key={company.key}
						value={company.key}
						id={company.key}
						className="scroll-mt-6 rounded-lg border bg-card not-last:border-b data-open:border-primary/60"
					>
						<AccordionTrigger
							data-pdf-href={getCompanyHref(company)}
							className="cursor-pointer gap-3 px-4 py-4 hover:bg-muted/40 hover:no-underline"
						>
							<CompanySummary company={company} />
						</AccordionTrigger>
						<AccordionContent
							data-pdf-exclude
							className="border-t px-4 pt-4 [&_a]:no-underline [&_p:not(:last-child)]:mb-0"
						>
							<KybCompanyDetail company={company} />
						</AccordionContent>
						<div data-pdf-only hidden className="border-t px-4 py-4">
							<KybCompanyDetail company={company} expanded />
						</div>
					</AccordionItem>
				))}
			</Accordion>
		</ReportSectionCard>
	);
}
