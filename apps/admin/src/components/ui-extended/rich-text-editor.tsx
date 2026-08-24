"use client";

import {
	CodeIcon,
	ListBulletsIcon,
	ListNumbersIcon,
	QuotesIcon,
	TextBolderIcon,
	TextItalicIcon,
	TextStrikethroughIcon,
} from "@phosphor-icons/react";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableRow } from "@tiptap/extension-table-row";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { type ReactNode, useEffect } from "react";
import { Button } from "@verifyafrica/ui/components/ui/button";
import {
	ButtonGroup,
	ButtonGroupSeparator,
} from "@verifyafrica/ui/components/ui/button-group";
import { RichTextEditorLinkPopover } from "#/components/ui-extended/rich-text-editor-link-popover";
import { RichTextEditorTablePicker } from "#/components/ui-extended/rich-text-editor-table-picker";
import { cn } from "#/lib/utils.ts";

type RichTextEditorProps = {
	id?: string;
	value: string;
	onChange: (value: string) => void;
	onBlur?: () => void;
	disabled?: boolean;
	placeholder?: string;
	className?: string;
	"aria-invalid"?: boolean;
};

type ToolbarButtonProps = {
	onClick: () => void;
	isActive?: boolean;
	disabled?: boolean;
	label: string;
	children: ReactNode;
};

function ToolbarButton({
	onClick,
	isActive,
	disabled,
	label,
	children,
}: ToolbarButtonProps) {
	return (
		<Button
			type="button"
			variant={isActive ? "default" : "ghost"}
			size="icon-sm"
			onMouseDown={(event) => {
				// Keep the editor selection when clicking toolbar controls.
				event.preventDefault();
			}}
			onClick={onClick}
			disabled={disabled}
			aria-label={label}
			aria-pressed={isActive}
			className="size-8 shrink-0"
		>
			{children}
		</Button>
	);
}

const editorContentClassName = cn(
	"rich-text-editor-content min-h-48 w-full px-2.5 py-2 text-sm outline-none",
	"prose prose-sm max-w-none dark:prose-invert",
	"prose-p:my-2 prose-p:leading-relaxed",
	"prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5",
	"prose-blockquote:my-3 prose-blockquote:rounded-md prose-blockquote:border-0 prose-blockquote:bg-foreground prose-blockquote:px-4 prose-blockquote:py-3 prose-blockquote:not-italic prose-blockquote:text-background",
	"prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none",
	"prose-th:font-normal prose-td:font-normal",
	"[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4",
	"[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:bg-primary/20",
	"[&_td]:border-t [&_td]:border-primary/25 [&_td]:px-4 [&_td]:py-3 [&_td]:align-top [&_td]:font-normal [&_td]:text-foreground",
	"[&_th]:border-t [&_th]:border-primary/25 [&_th]:px-4 [&_th]:py-3 [&_th]:align-top [&_th]:text-left [&_th]:font-normal [&_th]:text-foreground",
	"[&_tr:first-child_td]:border-t-0 [&_tr:first-child_th]:border-t-0",
);

export function RichTextEditor({
	id,
	value,
	onChange,
	onBlur,
	disabled = false,
	placeholder = "Write something…",
	className,
	"aria-invalid": ariaInvalid,
}: RichTextEditorProps) {
	const editor = useEditor({
		immediatelyRender: false,
		shouldRerenderOnTransaction: true,
		extensions: [
			StarterKit.configure({
				heading: false,
				horizontalRule: false,
				link: false,
			}),
			Link.configure({
				openOnClick: false,
				autolink: true,
				linkOnPaste: true,
				defaultProtocol: "https",
				HTMLAttributes: {
					class: "text-primary underline underline-offset-4",
				},
			}),
			Table.configure({
				resizable: false,
				HTMLAttributes: {
					class: "rich-text-table",
				},
			}),
			TableRow,
			TableHeader,
			TableCell,
			Placeholder.configure({
				placeholder,
				emptyEditorClass:
					"before:content-[attr(data-placeholder)] before:text-muted-foreground before:float-left before:h-0 before:pointer-events-none",
			}),
		],
		content: value,
		editable: !disabled,
		onUpdate: ({ editor: currentEditor }) => {
			onChange(currentEditor.getHTML());
		},
		onBlur: () => {
			onBlur?.();
		},
		editorProps: {
			attributes: {
				...(id ? { id } : {}),
				class: editorContentClassName,
			},
		},
	});

	useEffect(() => {
		if (!editor) return;
		editor.setEditable(!disabled);
	}, [disabled, editor]);

	useEffect(() => {
		if (!editor) return;
		const currentHtml = editor.getHTML();
		if (value !== currentHtml) {
			editor.commands.setContent(value, { emitUpdate: false });
		}
	}, [editor, value]);

	if (!editor) {
		return (
			<div
				className={cn(
					"min-h-56 rounded-md border border-input bg-transparent shadow-xs",
					disabled && "cursor-not-allowed opacity-50",
					ariaInvalid &&
						"border-destructive ring-3 ring-destructive/20 dark:border-destructive/50 dark:ring-destructive/40",
					className,
				)}
			/>
		);
	}

	return (
		<div
			data-slot="rich-text-editor"
			className={cn(
				"overflow-hidden rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30",
				disabled && "cursor-not-allowed opacity-50",
				ariaInvalid &&
					"border-destructive ring-3 ring-destructive/20 dark:border-destructive/50 dark:ring-destructive/40",
				className,
			)}
			aria-invalid={ariaInvalid}
		>
			<div className="flex items-center border-b border-input bg-muted/40 px-1 py-1">
				<ButtonGroup className="flex-wrap">
					<ToolbarButton
						label="Bold"
						disabled={disabled}
						isActive={editor.isActive("bold")}
						onClick={() => editor.chain().focus().toggleBold().run()}
					>
						<TextBolderIcon weight="bold" />
					</ToolbarButton>
					<ToolbarButton
						label="Italic"
						disabled={disabled}
						isActive={editor.isActive("italic")}
						onClick={() => editor.chain().focus().toggleItalic().run()}
					>
						<TextItalicIcon weight="bold" />
					</ToolbarButton>
					<ToolbarButton
						label="Strikethrough"
						disabled={disabled}
						isActive={editor.isActive("strike")}
						onClick={() => editor.chain().focus().toggleStrike().run()}
					>
						<TextStrikethroughIcon weight="bold" />
					</ToolbarButton>

					<ButtonGroupSeparator className="mx-0.5 h-6" />

					<RichTextEditorLinkPopover editor={editor} disabled={disabled} />

					<ButtonGroupSeparator className="mx-0.5 h-6" />

					<ToolbarButton
						label="Bullet list"
						disabled={disabled}
						isActive={editor.isActive("bulletList")}
						onClick={() => editor.chain().focus().toggleBulletList().run()}
					>
						<ListBulletsIcon weight="bold" />
					</ToolbarButton>
					<ToolbarButton
						label="Numbered list"
						disabled={disabled}
						isActive={editor.isActive("orderedList")}
						onClick={() => editor.chain().focus().toggleOrderedList().run()}
					>
						<ListNumbersIcon weight="bold" />
					</ToolbarButton>

					<ButtonGroupSeparator className="mx-0.5 h-6" />

					<RichTextEditorTablePicker editor={editor} disabled={disabled} />
					<ToolbarButton
						label="Blockquote"
						disabled={disabled}
						isActive={editor.isActive("blockquote")}
						onClick={() => editor.chain().focus().toggleBlockquote().run()}
					>
						<QuotesIcon weight="bold" />
					</ToolbarButton>
					<ToolbarButton
						label="Inline code"
						disabled={disabled}
						isActive={editor.isActive("code")}
						onClick={() => editor.chain().focus().toggleCode().run()}
					>
						<CodeIcon weight="bold" />
					</ToolbarButton>
				</ButtonGroup>
			</div>

			<div className="max-h-[420px] overflow-y-auto">
				<EditorContent editor={editor} />
			</div>
		</div>
	);
}
