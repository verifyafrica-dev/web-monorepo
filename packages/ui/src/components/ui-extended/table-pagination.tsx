import { useState } from "react";
import { DotsThreeIcon } from "@phosphor-icons/react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "../ui/pagination";
import { Skeleton } from "../ui/skeleton";
import { cn } from "../../lib/utils";

function getVisiblePages(
	currentPage: number,
	totalPages: number,
): Array<number | "ellipsis"> {
	if (totalPages <= 5) {
		return Array.from({ length: totalPages }, (_, index) => index + 1);
	}

	if (currentPage <= 3) {
		return [1, 2, 3, "ellipsis", totalPages];
	}

	if (currentPage >= totalPages - 2) {
		return [1, "ellipsis", totalPages - 2, totalPages - 1, totalPages];
	}

	return [1, "ellipsis", currentPage, "ellipsis", totalPages];
}

function PageJumpPopover({
	from,
	to,
	currentPage,
	onSelect,
}: {
	from: number;
	to: number;
	currentPage: number;
	onSelect: (page: number) => void;
}) {
	const [open, setOpen] = useState(false);
	const pages = Array.from({ length: to - from + 1 }, (_, i) => from + i);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					aria-label={`Jump to a page between ${from} and ${to}`}
				>
					<DotsThreeIcon />
				</Button>
			</PopoverTrigger>
			<PopoverContent align="center" className="w-56 p-2">
				<div className="grid max-h-56 grid-cols-4 gap-1 overflow-y-auto">
					{pages.map((pageNumber) => (
						<Button
							key={pageNumber}
							type="button"
							size="sm"
							variant={pageNumber === currentPage ? "outline" : "ghost"}
							onClick={() => {
								onSelect(pageNumber);
								setOpen(false);
							}}
						>
							{pageNumber}
						</Button>
					))}
				</div>
			</PopoverContent>
		</Popover>
	);
}

type TablePaginationProps = {
	page: number;
	pageSize: number;
	total: number;
	onPageChange: (page: number) => void;
	className?: string;
};

export function TablePagination({
	page,
	pageSize,
	total,
	onPageChange,
	className,
}: TablePaginationProps) {
	const totalPages = Math.max(1, Math.ceil(total / pageSize));
	const safePage = Math.min(page, totalPages);
	const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
	const end = Math.min(safePage * pageSize, total);
	const visiblePages = getVisiblePages(safePage, totalPages);

	return (
		<div
			className={cn(
				"flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6",
				className,
			)}
		>
			<p className="text-sm text-muted-foreground">
				{total === 0
					? "Showing 0 entries"
					: `Showing ${start} to ${end} of ${total} entries`}
			</p>
			{totalPages > 1 && (
				<Pagination className="mx-0 w-auto justify-end">
					<PaginationContent>
						<PaginationItem>
							<PaginationPrevious
								href="#"
								text="Previous"
								className={cn(
									safePage <= 1 && "pointer-events-none opacity-50",
								)}
								onClick={(event) => {
									event.preventDefault();
									onPageChange(Math.max(1, safePage - 1));
								}}
							/>
						</PaginationItem>
						{visiblePages.map((pageNumber, index) =>
							pageNumber === "ellipsis" ? (
								<PaginationItem
									key={`ellipsis-${index === 1 ? "start" : "end"}`}
								>
									<PageJumpPopover
										from={(visiblePages[index - 1] as number) + 1}
										to={(visiblePages[index + 1] as number) - 1}
										currentPage={safePage}
										onSelect={onPageChange}
									/>
								</PaginationItem>
							) : (
								<PaginationItem key={pageNumber}>
									<PaginationLink
										href="#"
										isActive={pageNumber === safePage}
										onClick={(event) => {
											event.preventDefault();
											onPageChange(pageNumber);
										}}
									>
										{pageNumber}
									</PaginationLink>
								</PaginationItem>
							),
						)}
						<PaginationItem>
							<PaginationNext
								href="#"
								text="Next"
								className={cn(
									safePage >= totalPages && "pointer-events-none opacity-50",
								)}
								onClick={(event) => {
									event.preventDefault();
									onPageChange(Math.min(totalPages, safePage + 1));
								}}
							/>
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			)}
		</div>
	);
}

export function TablePaginationSkeleton() {
	return (
		<div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
			<Skeleton className="h-4 w-44" />
			<Skeleton className="h-9 w-56" />
		</div>
	);
}

export function paginateItems<T>(items: T[], page: number, pageSize: number) {
	const total = items.length;
	const totalPages = Math.max(1, Math.ceil(total / pageSize));
	const safePage = Math.min(page, totalPages);

	return {
		items: items.slice((safePage - 1) * pageSize, safePage * pageSize),
		total,
		totalPages,
		safePage,
	};
}
