import { FileTextIcon } from "@phosphor-icons/react";
import { getV2ErrorMessage } from "@verifyafrica/api-client/http/shared";
import {
	TM_CASE_STATUSES,
	type TmCase,
	type TmCaseStatus,
	type TmReport,
} from "@verifyafrica/api-client/http/v2/transaction-monitoring/transaction-monitoring.types";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@verifyafrica/ui/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@verifyafrica/ui/components/ui/select";
import { Skeleton } from "@verifyafrica/ui/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@verifyafrica/ui/components/ui/table";
import { createSkeletonKeys } from "@verifyafrica/ui/lib/skeleton-keys";
import { cn } from "@verifyafrica/ui/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import {
	useCreateTmReportV2Mutation,
	useTmCasesV2Query,
	useUpdateTmCaseV2Mutation,
} from "#/api/http/v2/transaction-monitoring/transaction-monitoring.hooks";
import {
	CASE_PRIORITY_BADGE_CLASS,
	CASE_STATUS_BADGE_CLASS,
	formatAmount,
	formatCaseStatus,
	formatDateTime,
	titleCase,
} from "../-data";

const ALL = "all";

export function CasesTab({ tenantId }: { tenantId: string }) {
	const [statusFilter, setStatusFilter] = useState<string>(ALL);
	const casesQuery = useTmCasesV2Query(
		tenantId,
		statusFilter === ALL ? undefined : { status: statusFilter as TmCaseStatus },
	);
	const updateMutation = useUpdateTmCaseV2Mutation(tenantId);
	const reportMutation = useCreateTmReportV2Mutation(tenantId);
	const [report, setReport] = useState<TmReport | null>(null);
	const [pendingCaseId, setPendingCaseId] = useState<string | null>(null);

	const cases = casesQuery.data?.cases ?? [];

	function handleStatusChange(item: TmCase, status: TmCaseStatus) {
		setPendingCaseId(item.case_id);
		updateMutation.mutate(
			{ caseId: item.case_id, payload: { status } },
			{
				onSuccess: () =>
					toast.success(`Case moved to ${formatCaseStatus(status)}`),
				onError: (error) =>
					toast.error(getV2ErrorMessage(error, "Failed to update case.")),
				onSettled: () => setPendingCaseId(null),
			},
		);
	}

	function handleGenerateReport(item: TmCase) {
		setPendingCaseId(item.case_id);
		reportMutation.mutate(
			{ case_id: item.case_id, type: "STR" },
			{
				onSuccess: (data) => {
					setReport(data);
					toast.success("Report draft created");
				},
				onError: (error) =>
					toast.error(getV2ErrorMessage(error, "Failed to create report.")),
				onSettled: () => setPendingCaseId(null),
			},
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex flex-col gap-1">
					<h2 className="text-lg font-semibold tracking-tight">Cases</h2>
					<p className="max-w-2xl text-sm text-muted-foreground">
						Cases open automatically when a score crosses a monitor&apos;s
						auto-case threshold. Triage them here and draft regulatory reports.
					</p>
				</div>
				<Select value={statusFilter} onValueChange={setStatusFilter}>
					<SelectTrigger
						className="w-full sm:w-48"
						aria-label="Filter by status"
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={ALL}>All statuses</SelectItem>
						{TM_CASE_STATUSES.map((status) => (
							<SelectItem key={status} value={status}>
								{formatCaseStatus(status)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<Card>
				<CardContent className="pt-6">
					{casesQuery.isPending ? (
						<div className="space-y-3">
							{createSkeletonKeys(4, "tm-case-row").map((key) => (
								<Skeleton key={key} className="h-14 rounded-lg" />
							))}
						</div>
					) : casesQuery.isError ? (
						<p className="py-12 text-center text-sm text-destructive">
							Unable to load cases. Please try again.
						</p>
					) : cases.length === 0 ? (
						<p className="py-12 text-center text-sm text-muted-foreground">
							{statusFilter === ALL
								? "No cases yet. They'll appear when a score crosses your auto-case threshold."
								: "No cases with this status."}
						</p>
					) : (
						<div className="overflow-x-auto rounded-lg border">
							<Table>
								<TableHeader>
									<TableRow className="bg-muted/40 hover:bg-muted/40">
										{[
											"Case",
											"Priority",
											"Amount at risk",
											"Status",
											"Opened",
											"Actions",
										].map((heading) => (
											<TableHead
												key={heading}
												className="text-xs font-medium tracking-wide uppercase"
											>
												{heading}
											</TableHead>
										))}
									</TableRow>
								</TableHeader>
								<TableBody>
									{cases.map((item) => {
										const isPending = pendingCaseId === item.case_id;
										return (
											<TableRow key={item.case_id}>
												<TableCell className="max-w-xs whitespace-normal">
													<p className="font-medium">{item.title}</p>
													<p className="text-xs text-muted-foreground">
														{item.transaction_ids.length} transaction
														{item.transaction_ids.length === 1 ? "" : "s"}
														{item.suspect_ref ? ` · ${item.suspect_ref}` : ""}
													</p>
												</TableCell>
												<TableCell>
													<Badge
														variant="outline"
														className={cn(
															CASE_PRIORITY_BADGE_CLASS[item.priority],
														)}
													>
														{titleCase(item.priority)}
													</Badge>
												</TableCell>
												<TableCell className="tabular-nums">
													{formatAmount(item.amount_at_risk)}
												</TableCell>
												<TableCell>
													{item.allowed_next_statuses.length > 0 ? (
														<Select
															value={item.status}
															disabled={isPending}
															onValueChange={(value) =>
																handleStatusChange(item, value as TmCaseStatus)
															}
														>
															<SelectTrigger
																size="sm"
																className="w-40"
																aria-label={`Status for ${item.title}`}
															>
																<SelectValue />
															</SelectTrigger>
															<SelectContent>
																<SelectItem value={item.status}>
																	{formatCaseStatus(item.status)}
																</SelectItem>
																{/* Only transitions the backend will accept. */}
																{item.allowed_next_statuses.map((status) => (
																	<SelectItem key={status} value={status}>
																		{formatCaseStatus(status)}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
													) : (
														<Badge
															variant="outline"
															className={cn(
																CASE_STATUS_BADGE_CLASS[item.status],
															)}
														>
															{formatCaseStatus(item.status)}
														</Badge>
													)}
												</TableCell>
												<TableCell className="whitespace-nowrap text-muted-foreground">
													{formatDateTime(item.created_at)}
												</TableCell>
												<TableCell>
													<Button
														variant="outline"
														size="sm"
														disabled={isPending}
														onClick={() => handleGenerateReport(item)}
													>
														<FileTextIcon />
														Draft STR
													</Button>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			<Dialog
				open={report !== null}
				onOpenChange={(open) => !open && setReport(null)}
			>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>
							{report?.type} report · {titleCase(report?.status ?? "draft")}
						</DialogTitle>
						<DialogDescription>
							{report?.regulator ? `${report.regulator} · ` : ""}
							Drafts aren&apos;t filed automatically. Filing with the regulator
							is completed separately.
						</DialogDescription>
					</DialogHeader>
					{report && (
						<div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto text-sm">
							{report.subject && (
								<div>
									<p className="text-xs text-muted-foreground">Subject</p>
									<p className="font-medium">{report.subject}</p>
								</div>
							)}
							<div>
								<p className="text-xs text-muted-foreground">Narrative</p>
								<p className="whitespace-pre-wrap">
									{report.narrative ?? "No narrative was generated."}
								</p>
							</div>
							<p className="font-mono text-xs text-muted-foreground">
								Report ID: {report.report_id}
							</p>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
