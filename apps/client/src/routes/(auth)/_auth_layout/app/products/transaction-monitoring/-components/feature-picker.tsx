import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import type { TmFeature } from "@verifyafrica/api-client/http/v2/transaction-monitoring/transaction-monitoring.types";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Checkbox } from "@verifyafrica/ui/components/ui/checkbox";
import { Input } from "@verifyafrica/ui/components/ui/input";
import { Slider } from "@verifyafrica/ui/components/ui/slider";
import { cn } from "@verifyafrica/ui/lib/utils";
import { useMemo, useState } from "react";
import {
	describeWeight,
	type FeatureSelection,
	formatFieldLabel,
	formatWeight,
	getFeatureGroupLabel,
	groupFeatures,
	roundWeight,
	TM_FEATURE_GROUP_META,
} from "../-data";

interface FeaturePickerProps {
	catalog: TmFeature[];
	selection: FeatureSelection;
	onChange: (next: FeatureSelection) => void;
	disabled?: boolean;
}

export function FeaturePicker({
	catalog,
	selection,
	onChange,
	disabled,
}: FeaturePickerProps) {
	const [search, setSearch] = useState("");

	const groups = useMemo(() => {
		const query = search.trim().toLowerCase();
		const visible = query
			? catalog.filter(
					(feature) =>
						feature.label.toLowerCase().includes(query) ||
						feature.description.toLowerCase().includes(query) ||
						feature.key.toLowerCase().includes(query),
				)
			: catalog;
		return groupFeatures(visible);
	}, [catalog, search]);

	function toggle(feature: TmFeature, checked: boolean) {
		const next = { ...selection };
		if (checked) {
			next[feature.key] = selection[feature.key] ?? feature.default_weight;
		} else {
			delete next[feature.key];
		}
		onChange(next);
	}

	function setWeight(key: string, weight: number) {
		onChange({ ...selection, [key]: roundWeight(weight) });
	}

	function setGroup(items: TmFeature[], selected: boolean) {
		const next = { ...selection };
		for (const feature of items) {
			if (selected) {
				next[feature.key] = selection[feature.key] ?? feature.default_weight;
			} else {
				delete next[feature.key];
			}
		}
		onChange(next);
	}

	return (
		<div className="flex flex-col gap-5">
			<div className="relative">
				<MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					value={search}
					onChange={(event) => setSearch(event.target.value)}
					placeholder="Search features…"
					className="pl-9"
					aria-label="Search features"
				/>
			</div>

			{groups.length === 0 && (
				<p className="py-8 text-center text-sm text-muted-foreground">
					No features match “{search}”.
				</p>
			)}

			{groups.map(({ group, items }) => {
				const selectedCount = items.filter(
					(feature) => feature.key in selection,
				).length;
				const allSelected = selectedCount === items.length;

				return (
					<section key={group} className="flex flex-col gap-2">
						<div className="flex items-start justify-between gap-3">
							<div className="min-w-0">
								<h3 className="text-sm font-semibold">
									{getFeatureGroupLabel(group)}
									<span className="ml-2 font-normal text-muted-foreground tabular-nums">
										{selectedCount}/{items.length}
									</span>
								</h3>
								{TM_FEATURE_GROUP_META[group] && (
									<p className="text-xs text-muted-foreground">
										{TM_FEATURE_GROUP_META[group].description}
									</p>
								)}
							</div>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								disabled={disabled}
								onClick={() => setGroup(items, !allSelected)}
							>
								{allSelected ? "Clear" : "Select all"}
							</Button>
						</div>

						<ul className="flex flex-col divide-y rounded-lg border">
							{items.map((feature) => {
								const isSelected = feature.key in selection;
								const weight = selection[feature.key] ?? feature.default_weight;
								const inputId = `tm-feature-${feature.key}`;

								return (
									<li
										key={feature.key}
										className={cn(
											"flex flex-col gap-3 p-3 transition-colors",
											isSelected && "bg-secondary/5",
										)}
									>
										<div className="flex items-start gap-3">
											<Checkbox
												id={inputId}
												checked={isSelected}
												disabled={disabled}
												onCheckedChange={(checked) =>
													toggle(feature, checked === true)
												}
												className="mt-0.5"
											/>
											<label
												htmlFor={inputId}
												className="flex min-w-0 flex-1 cursor-pointer flex-col gap-1"
											>
												<span className="text-sm font-medium">
													{feature.label}
												</span>
												<span className="text-xs text-muted-foreground">
													{feature.description}
												</span>
											</label>
										</div>

										{isSelected && (
											<div className="flex flex-col gap-2 pl-7">
												<div className="flex items-center gap-3">
													<Slider
														min={0}
														max={1}
														step={0.05}
														value={[weight]}
														disabled={disabled}
														onValueChange={([value]) =>
															setWeight(feature.key, value ?? weight)
														}
														aria-label={`${feature.label} weight`}
													/>
													<span className="w-24 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
														{formatWeight(weight)} · {describeWeight(weight)}
													</span>
												</div>
												{feature.required_fields.length > 0 && (
													<div className="flex flex-wrap items-center gap-1.5">
														<span className="text-xs text-muted-foreground">
															Needs:
														</span>
														{feature.required_fields.map((field) => (
															<Badge
																key={field}
																variant="outline"
																className="font-mono text-[11px] font-normal"
															>
																{field}
															</Badge>
														))}
													</div>
												)}
											</div>
										)}
									</li>
								);
							})}
						</ul>
					</section>
				);
			})}
		</div>
	);
}

export function DataContractList({ fields }: { fields: string[] }) {
	return (
		<div className="flex flex-wrap gap-1.5">
			{fields.map((field) => (
				<Badge
					key={field}
					variant="outline"
					className="font-mono text-[11px] font-normal"
					title={formatFieldLabel(field)}
				>
					{field}
				</Badge>
			))}
		</div>
	);
}
