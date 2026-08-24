"use client";

import { TableIcon, TrashIcon } from "@phosphor-icons/react";
import type { Editor } from "@tiptap/react";
import { useState } from "react";
import { Button } from "@verifyafrica/ui/components/ui/button";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@verifyafrica/ui/components/ui/hover-card";
import { Input } from "@verifyafrica/ui/components/ui/input";
import { Label } from "@verifyafrica/ui/components/ui/label";
import { cn } from "#/lib/utils.ts";

const MAX_GRID_ROWS = 8;
const MAX_GRID_COLS = 8;
const MAX_CUSTOM_ROWS = 20;
const MAX_CUSTOM_COLS = 12;

type TableSize = { rows: number; cols: number };

function getTableDimensions(editor: Editor): TableSize | null {
	const { selection } = editor.state;

	for (let depth = selection.$from.depth; depth > 0; depth -= 1) {
		const node = selection.$from.node(depth);
		if (node.type.name === "table") {
			return {
				rows: node.childCount,
				cols: node.firstChild?.childCount ?? 0,
			};
		}
	}

	return null;
}

function clampTableSize(rows: number, cols: number): TableSize {
	return {
		rows: Math.min(MAX_CUSTOM_ROWS, Math.max(1, rows)),
		cols: Math.min(MAX_CUSTOM_COLS, Math.max(1, cols)),
	};
}

function resizeTable(editor: Editor, targetRows: number, targetCols: number) {
	if (!editor.isActive("table")) {
		return;
	}

	const target = clampTableSize(targetRows, targetCols);
	let dimensions = getTableDimensions(editor);
	if (!dimensions) {
		return;
	}

	editor.chain().focus().run();

	while (dimensions.cols < target.cols) {
		if (!editor.chain().focus().addColumnAfter().run()) {
			break;
		}
		dimensions = getTableDimensions(editor) ?? dimensions;
	}

	while (dimensions.cols > target.cols) {
		if (!editor.chain().focus().deleteColumn().run()) {
			break;
		}
		dimensions = getTableDimensions(editor) ?? dimensions;
	}

	while (dimensions.rows < target.rows) {
		if (!editor.chain().focus().addRowAfter().run()) {
			break;
		}
		dimensions = getTableDimensions(editor) ?? dimensions;
	}

	while (dimensions.rows > target.rows) {
		if (!editor.chain().focus().deleteRow().run()) {
			break;
		}
		dimensions = getTableDimensions(editor) ?? dimensions;
	}
}

function syncPickerState(
	editor: Editor,
	setHoverSize: (size: TableSize) => void,
	setCustomRows: (value: string) => void,
	setCustomCols: (value: string) => void,
) {
	const dimensions = getTableDimensions(editor);
	if (!dimensions) {
		return;
	}

	setHoverSize(dimensions);
	setCustomRows(String(dimensions.rows));
	setCustomCols(String(dimensions.cols));
}

export function RichTextEditorTablePicker({
	editor,
	disabled,
}: {
	editor: Editor;
	disabled?: boolean;
}) {
	const isInTable = editor.isActive("table");
	const tableDimensions = isInTable ? getTableDimensions(editor) : null;

	const [hoverSize, setHoverSize] = useState<TableSize>({ rows: 0, cols: 0 });
	const [customRows, setCustomRows] = useState("3");
	const [customCols, setCustomCols] = useState("2");

	const previewSize =
		hoverSize.rows > 0 && hoverSize.cols > 0 ? hoverSize : null;

	const applyCustomSize = () => {
		const parsed = clampTableSize(
			Number.parseInt(customRows, 10),
			Number.parseInt(customCols, 10),
		);

		if (Number.isNaN(Number.parseInt(customRows, 10))) {
			return;
		}
		if (Number.isNaN(Number.parseInt(customCols, 10))) {
			return;
		}

		if (isInTable) {
			resizeTable(editor, parsed.rows, parsed.cols);
			syncPickerState(editor, setHoverSize, setCustomRows, setCustomCols);
			return;
		}

		editor
			.chain()
			.focus()
			.insertTable({
				rows: parsed.rows,
				cols: parsed.cols,
				withHeaderRow: false,
			})
			.run();
		setHoverSize(parsed);
		setCustomRows(String(parsed.rows));
		setCustomCols(String(parsed.cols));
	};

	const applyGridSize = (rows: number, cols: number) => {
		const size = clampTableSize(rows, cols);

		if (isInTable) {
			resizeTable(editor, size.rows, size.cols);
			syncPickerState(editor, setHoverSize, setCustomRows, setCustomCols);
			return;
		}

		editor
			.chain()
			.focus()
			.insertTable({
				rows: size.rows,
				cols: size.cols,
				withHeaderRow: false,
			})
			.run();
		setHoverSize(size);
		setCustomRows(String(size.rows));
		setCustomCols(String(size.cols));
	};

	return (
		<HoverCard
			openDelay={120}
			closeDelay={120}
			onOpenChange={(open) => {
				if (open && editor.isActive("table")) {
					syncPickerState(editor, setHoverSize, setCustomRows, setCustomCols);
					return;
				}

				if (!open) {
					setHoverSize({ rows: 0, cols: 0 });
				}
			}}
		>
			<HoverCardTrigger asChild>
				<Button
					type="button"
					variant={isInTable ? "default" : "ghost"}
					size="icon-sm"
					disabled={disabled}
					onMouseDown={(event) => {
						event.preventDefault();
					}}
					aria-label={isInTable ? "Edit table" : "Insert table"}
					aria-pressed={isInTable}
					className="size-8 shrink-0"
				>
					<TableIcon weight="bold" />
				</Button>
			</HoverCardTrigger>
			<HoverCardContent align="start" className="w-auto p-3">
				<div className="space-y-3">
					<div className="space-y-1">
						<p className="text-sm font-medium">
							{isInTable ? "Edit table" : "Insert table"}
						</p>
						<p className="text-xs text-muted-foreground">
							{previewSize
								? `${previewSize.rows} × ${previewSize.cols} table`
								: isInTable && tableDimensions
									? `Current size: ${tableDimensions.rows} × ${tableDimensions.cols}`
									: "Select table size"}
						</p>
					</div>

					<div
						className="inline-grid gap-1"
						style={{
							gridTemplateColumns: `repeat(${MAX_GRID_COLS}, minmax(0, 1fr))`,
						}}
					>
						{Array.from(
							{ length: MAX_GRID_ROWS * MAX_GRID_COLS },
							(_, index) => {
								const row = Math.floor(index / MAX_GRID_COLS) + 1;
								const col = (index % MAX_GRID_COLS) + 1;
								const isHighlighted =
									previewSize !== null &&
									row <= previewSize.rows &&
									col <= previewSize.cols;

								return (
									<button
										key={`${row}-${col}`}
										type="button"
										className={cn(
											"size-4 rounded-sm border transition-colors",
											isHighlighted
												? "border-primary bg-primary"
												: "border-border bg-muted/40 hover:bg-muted",
										)}
										onMouseDown={(event) => {
											event.preventDefault();
										}}
										onMouseEnter={() => setHoverSize({ rows: row, cols: col })}
										onClick={() => applyGridSize(row, col)}
										aria-label={`${isInTable ? "Resize to" : "Insert"} ${row} by ${col} table`}
									/>
								);
							},
						)}
					</div>

					<div className="grid grid-cols-2 gap-2">
						<div className="space-y-1.5">
							<Label htmlFor="rich-text-editor-table-rows">Rows</Label>
							<Input
								id="rich-text-editor-table-rows"
								type="number"
								min={1}
								max={MAX_CUSTOM_ROWS}
								value={customRows}
								onChange={(event) => setCustomRows(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === "Enter") {
										event.preventDefault();
										applyCustomSize();
									}
								}}
								disabled={disabled}
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="rich-text-editor-table-cols">Columns</Label>
							<Input
								id="rich-text-editor-table-cols"
								type="number"
								min={1}
								max={MAX_CUSTOM_COLS}
								value={customCols}
								onChange={(event) => setCustomCols(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === "Enter") {
										event.preventDefault();
										applyCustomSize();
									}
								}}
								disabled={disabled}
							/>
						</div>
					</div>

					<div className="flex items-center justify-end gap-2">
						{isInTable ? (
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={disabled}
								onMouseDown={(event) => event.preventDefault()}
								onClick={() => editor.chain().focus().deleteTable().run()}
							>
								<TrashIcon />
								Delete table
							</Button>
						) : null}
						<Button
							type="button"
							size="sm"
							disabled={disabled}
							onMouseDown={(event) => event.preventDefault()}
							onClick={applyCustomSize}
						>
							{isInTable ? "Apply size" : "Insert table"}
						</Button>
					</div>
				</div>
			</HoverCardContent>
		</HoverCard>
	);
}
