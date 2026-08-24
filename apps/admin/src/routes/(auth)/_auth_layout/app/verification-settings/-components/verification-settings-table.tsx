import { Input } from "@verifyafrica/ui/components/ui/input";
import { Skeleton } from "@verifyafrica/ui/components/ui/skeleton";
import { Switch } from "@verifyafrica/ui/components/ui/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@verifyafrica/ui/components/ui/table";
import { cn } from "#/lib/utils.ts";
import { createSkeletonKeys } from "#/lib/skeleton-keys";
import type { VerificationPrice } from "#/api/http/v2/verifications/verifications.types";
import {
	createVerificationPriceDraft,
	formatVerificationSettingsLabel,
	getVerificationPriceDisplayValue,
	getVerificationPriceDraftKey,
	type VerificationPriceDraft,
	type VerificationPriceGroup,
	isValidPriceInput,
} from "../-data";

function PriceInput({
	value,
	disabled,
	onChange,
}: {
	value: string;
	disabled?: boolean;
	onChange: (value: string) => void;
}) {
	return (
		<div className="relative w-32">
			<span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
				$
			</span>
			<Input
				value={value}
				disabled={disabled}
				inputMode="decimal"
				className="pl-7 tabular-nums"
				onChange={(event) => {
					const nextValue = event.target.value;
					if (isValidPriceInput(nextValue)) {
						onChange(nextValue);
					}
				}}
			/>
		</div>
	);
}

export function VerificationSettingsTableSkeleton() {
	return (
		<div className="space-y-3">
			{createSkeletonKeys(8, "verification-settings-row").map((key) => (
				<Skeleton
					key={key}
					className="h-14 rounded-lg"
				/>
			))}
		</div>
	);
}

export function VerificationSettingsTable({
	rows,
	drafts,
	disabled,
	onDraftsChange,
}: {
	rows: VerificationPriceGroup[];
	drafts: Record<string, VerificationPriceDraft>;
	disabled?: boolean;
	onDraftsChange: (
		updater: (
			current: Record<string, VerificationPriceDraft>,
		) => Record<string, VerificationPriceDraft>,
	) => void;
}) {
	const updateDraft = (
		price: VerificationPrice,
		field: keyof VerificationPriceDraft,
		value: string | boolean,
	) => {
		const key = getVerificationPriceDraftKey(
			price.verification_type,
			price.plan,
		);

		onDraftsChange((current) => ({
			...current,
			[key]: {
				...(current[key] ?? createVerificationPriceDraft(price)),
				[field]: value,
			},
		}));
	};

	const updateBothPlans = (
		group: VerificationPriceGroup,
		updater: (draft: VerificationPriceDraft) => Partial<VerificationPriceDraft>,
	) => {
		onDraftsChange((current) => {
			const paygKey = getVerificationPriceDraftKey(
				group.verificationType,
				group.payg.plan,
			);
			const enterpriseKey = getVerificationPriceDraftKey(
				group.verificationType,
				group.enterprise.plan,
			);
			const paygDraft =
				current[paygKey] ?? createVerificationPriceDraft(group.payg);
			const enterpriseDraft =
				current[enterpriseKey] ??
				createVerificationPriceDraft(group.enterprise);

			return {
				...current,
				[paygKey]: {
					...paygDraft,
					...updater(paygDraft),
				},
				[enterpriseKey]: {
					...enterpriseDraft,
					...updater(enterpriseDraft),
				},
			};
		});
	};

	if (rows.length === 0) {
		return (
			<p className="py-12 text-center text-sm text-muted-foreground">
				No verification settings found.
			</p>
		);
	}

	return (
		<div className="overflow-x-auto rounded-lg border">
			<Table>
				<TableHeader>
					<TableRow className="bg-muted/40 hover:bg-muted/40">
						<TableHead className="text-xs font-medium tracking-wide uppercase">
							Verification Type
						</TableHead>
						<TableHead className="text-xs font-medium tracking-wide uppercase">
							PAYG Unit Price
						</TableHead>
						<TableHead className="text-xs font-medium tracking-wide uppercase">
							Enterprise Unit Price
						</TableHead>
						<TableHead className="text-xs font-medium tracking-wide uppercase">
							Currency
						</TableHead>
						<TableHead className="text-xs font-medium tracking-wide uppercase">
							Active
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{rows.map((group) => {
						const isActive = Boolean(
							getVerificationPriceDisplayValue(
								group.payg,
								"is_active",
								drafts,
							),
						);

						return (
							<TableRow
								key={group.verificationType}
								className={cn(!isActive && "opacity-60")}
							>
								<TableCell className="font-medium whitespace-nowrap">
									{formatVerificationSettingsLabel(group.verificationType)}
								</TableCell>
								<TableCell>
									<PriceInput
										value={String(
											getVerificationPriceDisplayValue(
												group.payg,
												"selling_price",
												drafts,
											),
										)}
										disabled={disabled}
										onChange={(value) =>
											updateDraft(group.payg, "selling_price", value)
										}
									/>
								</TableCell>
								<TableCell>
									<PriceInput
										value={String(
											getVerificationPriceDisplayValue(
												group.enterprise,
												"selling_price",
												drafts,
											),
										)}
										disabled={disabled}
										onChange={(value) =>
											updateDraft(group.enterprise, "selling_price", value)
										}
									/>
								</TableCell>
								<TableCell>
									<Input
										value={String(
											getVerificationPriceDisplayValue(
												group.payg,
												"currency",
												drafts,
											),
										)}
										disabled
										className="w-20"
									/>
								</TableCell>
								<TableCell>
									<Switch
										checked={isActive}
										disabled={disabled}
										onCheckedChange={(checked) => {
											updateBothPlans(group, () => ({
												is_active: checked,
											}));
										}}
									/>
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
}
