import { Skeleton } from "@verifyafrica/ui/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@verifyafrica/ui/components/ui/table";

type TeamTableSkeletonProps = {
	columns: string[];
	rows?: number;
};

const skeletonRowIds = ["one", "two", "three", "four", "five"];

export const TEAM_TABLE_SKELETON_ROWS = 5;

export function TeamTableSkeleton({
	columns,
	rows = TEAM_TABLE_SKELETON_ROWS,
}: TeamTableSkeletonProps) {
	return (
		<Table>
			<TableHeader>
				<TableRow className="hover:bg-transparent">
					{columns.map((column, index) => (
						<TableHead
							key={column}
							className={
								index === 0
									? "pl-4 text-xs font-semibold tracking-wide uppercase sm:pl-6"
									: index === columns.length - 1
										? "pr-4 text-xs font-semibold tracking-wide uppercase sm:pr-6"
										: "text-xs font-semibold tracking-wide uppercase"
							}
						>
							{column}
						</TableHead>
					))}
				</TableRow>
			</TableHeader>
			<TableBody>
				{skeletonRowIds.slice(0, rows).map((rowId) => (
					<TableRow key={`team-table-skeleton-${rowId}`}>
						{columns.map((column, index) => (
							<TableCell
								key={`${rowId}-${column}`}
								className={
									index === 0
										? "pl-4 sm:pl-6"
										: index === columns.length - 1
											? "pr-4 sm:pr-6"
											: undefined
								}
							>
								<TeamTableCellSkeleton
									columnIndex={index}
									total={columns.length}
								/>
							</TableCell>
						))}
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

function TeamTableCellSkeleton({
	columnIndex,
	total,
}: {
	columnIndex: number;
	total: number;
}) {
	if (columnIndex === 0) {
		return (
			<div className="flex items-center gap-3">
				<Skeleton className="size-8 rounded-full" />
				<Skeleton className="h-4 w-36" />
			</div>
		);
	}

	if (columnIndex === total - 1) {
		return <Skeleton className="h-8 w-20" />;
	}

	if (columnIndex === 2 || columnIndex === total - 2) {
		return <Skeleton className="h-6 w-16 rounded-full" />;
	}

	return <Skeleton className="h-4 w-28" />;
}
