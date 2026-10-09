import { BuildingsIcon } from "@phosphor-icons/react";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { cn } from "@verifyafrica/ui/lib/utils";

import { asUnknownArray } from "../../-utils";
import {
	ReportCardDetailPanel,
	ReportCardDetailView,
	ReportCardGrid,
	ReportPdfCard,
	ReportSelectableCard,
} from "../report-card-selector";
import { ReportSectionCard } from "../report-sections";
import { KybCompanyDetail } from "./kyb-company-detail";
import { KybRegistryBadge } from "./kyb-registry-badge";
import type { KybCompanySummary } from "./kyb-screening-sections";

export const KYB_COMPANIES_SECTION_ID = "kyb-matched-companies";

function getPdfDetailId(company: KybCompanySummary) {
	return `pdf-${company.key}`;
}

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

export function KybCompanyList({
	companies,
	selectedKey,
	onSelect,
	onBack,
	getCompanyHref,
}: {
	companies: KybCompanySummary[];
	selectedKey?: string;
	onSelect: (company: KybCompanySummary) => void;
	onBack: (company: KybCompanySummary) => void;
	getCompanyHref: (company: KybCompanySummary) => string;
}) {
	if (companies.length === 0) return null;

	const selectedIndex = companies.findIndex(
		(company) => company.key === selectedKey,
	);
	const selected = companies[selectedIndex];

	return (
		<ReportSectionCard
			id={KYB_COMPANIES_SECTION_ID}
			title={`Matched Companies (${companies.length})`}
		>
			<div data-pdf-exclude>
				{selected ? (
					<ReportCardDetailView
						backLabel="All companies"
						position={`Company ${selectedIndex + 1} of ${companies.length}`}
						onBack={() => onBack(selected)}
					>
						<ReportCardDetailPanel
							summary={<CompanySummary company={selected} />}
						>
							<KybCompanyDetail company={selected} />
						</ReportCardDetailPanel>
					</ReportCardDetailView>
				) : (
					<ReportCardGrid>
						{companies.map((company) => (
							<ReportSelectableCard
								key={company.key}
								id={company.key}
								onSelect={() => onSelect(company)}
							>
								<CompanySummary company={company} />
							</ReportSelectableCard>
						))}
					</ReportCardGrid>
				)}
			</div>
			<div data-pdf-only hidden className="space-y-6">
				<div className="space-y-3">
					<p className="text-xs text-muted-foreground">
						Select a company to jump to its details.
					</p>
					<ReportCardGrid>
						{companies.map((company) => (
							<ReportPdfCard
								key={company.key}
								targetId={getPdfDetailId(company)}
							>
								<CompanySummary company={company} />
							</ReportPdfCard>
						))}
					</ReportCardGrid>
				</div>
				<div className="space-y-3">
					<p className="text-sm font-medium">Company Details</p>
					{companies.map((company) => (
						<ReportCardDetailPanel
							key={company.key}
							id={getPdfDetailId(company)}
							href={getCompanyHref(company)}
							summary={<CompanySummary company={company} />}
						>
							<KybCompanyDetail company={company} expanded />
						</ReportCardDetailPanel>
					))}
				</div>
			</div>
		</ReportSectionCard>
	);
}
