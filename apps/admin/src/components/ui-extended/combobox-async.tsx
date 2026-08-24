// Ref: https://www.shadcnblocks.com/component/combobox/combobox-custom-actions-4

"use client";

import {
	CaretUpDownIcon,
	CheckIcon,
	CircleNotchIcon,
	XIcon,
} from "@phosphor-icons/react";
import { startTransition, useEffect, useId, useRef, useState } from "react";

import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { Button } from "@verifyafrica/ui/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@verifyafrica/ui/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@verifyafrica/ui/components/ui/popover";
import { cn } from "@verifyafrica/ui/lib/utils";

export type AsyncComboboxOption = {
	value: string;
	label: string;
	description?: string;
};

export type AsyncComboboxSearchResult = {
	items: AsyncComboboxOption[];
	hasMore: boolean;
};

export type AsyncComboboxProps = {
	value: AsyncComboboxOption[];
	onChange: (value: AsyncComboboxOption[]) => void;
	onSearch: (query: string, page: number) => Promise<AsyncComboboxSearchResult>;
	placeholder?: string;
	searchPlaceholder?: string;
	emptyMessage?: string;
	disabled?: boolean;
	className?: string;
	debounceMs?: number;
	/** When true, search runs even with an empty query (initial page load). */
	searchOnEmpty?: boolean;
};

export function AsyncCombobox({
	value,
	onChange,
	onSearch,
	placeholder = "Select…",
	searchPlaceholder = "Type to search…",
	emptyMessage = "No results found.",
	disabled = false,
	className,
	debounceMs = 300,
	searchOnEmpty = true,
}: AsyncComboboxProps) {
	const listboxId = useId();
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [results, setResults] = useState<AsyncComboboxOption[]>([]);
	const [hasMore, setHasMore] = useState(false);
	const [isSearching, setIsSearching] = useState(false);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const requestIdRef = useRef(0);
	const selectedValues = new Set(value.map((item) => item.value));

	useEffect(() => {
		if (!open) return;

		const trimmed = search.trim();
		if (!trimmed && !searchOnEmpty) {
			startTransition(() => {
				setResults([]);
				setHasMore(false);
				setIsSearching(false);
				setPage(1);
			});
			return;
		}

		const requestId = ++requestIdRef.current;
		startTransition(() => {
			setIsSearching(true);
			setPage(1);
		});

		const timer = setTimeout(() => {
			void (async () => {
				try {
					const next = await onSearch(trimmed, 1);
					if (requestId !== requestIdRef.current) return;
					startTransition(() => {
						setResults(next.items);
						setHasMore(next.hasMore);
						setIsSearching(false);
					});
				} catch {
					if (requestId !== requestIdRef.current) return;
					startTransition(() => {
						setResults([]);
						setHasMore(false);
						setIsSearching(false);
					});
				}
			})();
		}, debounceMs);

		return () => clearTimeout(timer);
	}, [open, search, onSearch, debounceMs, searchOnEmpty]);

	const handleLoadMore = async () => {
		if (isLoadingMore || !hasMore) return;
		const nextPage = page + 1;
		const requestId = requestIdRef.current;
		setIsLoadingMore(true);
		try {
			const next = await onSearch(search.trim(), nextPage);
			if (requestId !== requestIdRef.current) return;
			startTransition(() => {
				setResults((current) => {
					const seen = new Set(current.map((item) => item.value));
					const appended = next.items.filter((item) => !seen.has(item.value));
					return [...current, ...appended];
				});
				setHasMore(next.hasMore);
				setPage(nextPage);
			});
		} finally {
			if (requestId === requestIdRef.current) {
				setIsLoadingMore(false);
			}
		}
	};

	const toggleOption = (option: AsyncComboboxOption) => {
		if (selectedValues.has(option.value)) {
			onChange(value.filter((item) => item.value !== option.value));
			return;
		}
		onChange([...value, option]);
	};

	const removeOption = (optionValue: string) => {
		onChange(value.filter((item) => item.value !== optionValue));
	};

	return (
		<div className={cn("flex w-full flex-col gap-2", className)}>
			<Popover
				open={open}
				onOpenChange={setOpen}
			>
				<PopoverTrigger asChild>
					<Button
						type="button"
						variant="outline"
						role="combobox"
						aria-expanded={open}
						aria-controls={listboxId}
						disabled={disabled}
						className="h-auto min-h-9 w-full justify-between px-3 py-2 font-normal"
					>
						<span className="truncate text-left text-muted-foreground">
							{value.length > 0 ? `${value.length} selected` : placeholder}
						</span>
						<CaretUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent
					className="w-(--radix-popover-trigger-width) p-0"
					align="start"
				>
					<Command
						shouldFilter={false}
						id={listboxId}
					>
						<CommandInput
							value={search}
							onValueChange={setSearch}
							placeholder={searchPlaceholder}
							disabled={disabled}
						/>
						<CommandList>
							{isSearching ? (
								<div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
									<CircleNotchIcon className="size-4 animate-spin" />
									Searching…
								</div>
							) : (
								<>
									{!search.trim() && !searchOnEmpty && (
										<div className="p-4 text-center text-sm text-muted-foreground">
											Start typing to search
										</div>
									)}
									{results.length === 0 ? (
										<CommandEmpty>{emptyMessage}</CommandEmpty>
									) : (
										<CommandGroup>
											{results.map((option) => {
												const selected = selectedValues.has(option.value);
												return (
													<CommandItem
														key={option.value}
														value={option.value}
														onSelect={() => toggleOption(option)}
													>
														<CheckIcon
															className={cn(
																"mr-2 size-4 shrink-0",
																selected ? "opacity-100" : "opacity-0",
															)}
														/>
														<span className="flex min-w-0 flex-col">
															<span className="truncate">{option.label}</span>
															{option.description ? (
																<span className="truncate text-xs text-muted-foreground">
																	{option.description}
																</span>
															) : null}
														</span>
													</CommandItem>
												);
											})}
										</CommandGroup>
									)}
									{hasMore ? (
										<div className="border-t p-1">
											<Button
												type="button"
												variant="ghost"
												size="sm"
												className="w-full"
												disabled={isLoadingMore || disabled}
												onClick={() => void handleLoadMore()}
											>
												{isLoadingMore ? (
													<>
														<CircleNotchIcon className="mr-2 size-4 animate-spin" />
														Loading…
													</>
												) : (
													"Load more"
												)}
											</Button>
										</div>
									) : null}
								</>
							)}
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>

			{value.length > 0 ? (
				<div className="flex flex-wrap gap-1.5">
					{value.map((option) => (
						<Badge
							key={option.value}
							className="gap-1 pr-1"
						>
							<span className="max-w-56 truncate">{option.label}</span>
							<button
								type="button"
								className="rounded-full p-0.5 hover:bg-muted"
								disabled={disabled}
								aria-label={`Remove ${option.label}`}
								onClick={() => removeOption(option.value)}
							>
								<XIcon className="size-3" />
							</button>
						</Badge>
					))}
				</div>
			) : null}
		</div>
	);
}

export default AsyncCombobox;
