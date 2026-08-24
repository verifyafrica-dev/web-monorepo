import type { VerificationRequestDetail } from "#/api/http/v2/verifications/verifications.types";
import { Card, CardContent, CardHeader, CardTitle } from "@verifyafrica/ui/components/ui/card";
import { isPlainObject } from "#/lib/validators";
import { ReportDetailField } from "./report-detail-field";

type VerificationResultPanelProps = {
	title?: string;
	data: Record<string, unknown> | null | undefined;
	emptyMessage?: string;
	verification?: VerificationRequestDetail | null;
};

function getResultItemKey(parentKey: string, item: unknown) {
	if (isPlainObject(item)) {
		return `${parentKey}-${JSON.stringify(item)}`;
	}

	return `${parentKey}-${String(item)}`;
}

function formatFieldLabel(key: string) {
	return key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function isImageValue(value: string) {
	return (
		value.startsWith("data:image/") ||
		value.startsWith("http://") ||
		value.startsWith("https://")
	);
}

function renderPrimitiveValue(value: unknown) {
	if (value === null || value === undefined || value === "") {
		return "N/A";
	}

	if (typeof value === "boolean") {
		return value ? "Yes" : "No";
	}

	if (typeof value === "string" && isImageValue(value)) {
		return (
			<img
				src={value}
				alt="Verification proof"
				className="max-h-40 rounded-md border object-contain"
			/>
		);
	}

	if (typeof value === "object") {
		return (
			<pre className="overflow-x-auto rounded-md bg-muted/40 p-3 text-xs">
				{JSON.stringify(value, null, 2)}
			</pre>
		);
	}

	return (
		<p className="text-sm capitalize">{String(value).split("_").join(" ")}</p>
	);
}

function ResultFieldGrid({ data }: { data: Record<string, unknown> }) {
	const entries = Object.entries(data).filter(
		([, value]) => value !== null && value !== undefined && value !== "",
	);

	if (entries.length === 0) {
		return (
			<p className="text-sm text-muted-foreground">
				No result fields available yet.
			</p>
		);
	}

	return (
		<div className="grid gap-4 sm:grid-cols-2">
			{entries.map(([key, value]) => {
				if (isPlainObject(value)) {
					const nestedData = value as Record<string, unknown>;

					return (
						<div
							key={key}
							className="sm:col-span-2"
						>
							<Card className="border-dashed bg-muted/20 shadow-none">
								<CardHeader className="pb-3">
									<CardTitle className="text-sm font-semibold">
										{formatFieldLabel(key)}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<ResultFieldGrid data={nestedData} />
								</CardContent>
							</Card>
						</div>
					);
				}

				if (Array.isArray(value)) {
					return (
						<div
							key={key}
							className="sm:col-span-2"
						>
							<Card className="border-dashed bg-muted/20 shadow-none">
								<CardHeader className="pb-3">
									<CardTitle className="text-sm font-semibold">
										{formatFieldLabel(key)}
									</CardTitle>
								</CardHeader>
								<CardContent className="flex flex-row gap-2">
									{value.length === 0 ? (
										<p className="text-sm text-muted-foreground">No items.</p>
									) : (
										value.map((item) => {
											if (isPlainObject(item)) {
												const nestedItem = item as Record<string, unknown>;

												return (
													<ResultFieldGrid
														key={getResultItemKey(key, nestedItem)}
														data={nestedItem}
													/>
												);
											}

											return (
												<p
													key={getResultItemKey(key, item)}
													className="text-sm"
												>
													{renderPrimitiveValue(item)}
												</p>
											);
										})
									)}
								</CardContent>
							</Card>
						</div>
					);
				}

				return (
					<ReportDetailField
						key={key}
						label={formatFieldLabel(key)}
						value={renderPrimitiveValue(value)}
					/>
				);
			})}
		</div>
	);
}

export function VerificationResultPanel({
	title = "Verification Result",
	data,
	emptyMessage = "Verification results are not available yet.",
	verification: _verification,
}: VerificationResultPanelProps) {
	const hasData = data && Object.keys(data).length > 0;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base font-semibold">{title}</CardTitle>
			</CardHeader>
			<CardContent>
				{hasData ? (
					<ResultFieldGrid data={data} />
				) : (
					<p className="text-sm text-muted-foreground">{emptyMessage}</p>
				)}
			</CardContent>
		</Card>
	);
}
