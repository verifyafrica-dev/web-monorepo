"use client";

import { LinkBreakIcon, LinkIcon } from "@phosphor-icons/react";
import type { Editor } from "@tiptap/react";
import { useEffect, useState } from "react";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Input } from "@verifyafrica/ui/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@verifyafrica/ui/components/ui/popover";

export function RichTextEditorLinkPopover({
	editor,
	disabled,
}: {
	editor: Editor;
	disabled?: boolean;
}) {
	const [open, setOpen] = useState(false);
	const [url, setUrl] = useState("");
	const isActive = editor.isActive("link");

	useEffect(() => {
		if (!open) return;
		setUrl(String(editor.getAttributes("link").href ?? ""));
	}, [editor, open]);

	const applyLink = () => {
		const trimmed = url.trim();
		if (!trimmed) {
			editor.chain().focus().extendMarkRange("link").unsetLink().run();
			setOpen(false);
			return;
		}

		editor
			.chain()
			.focus()
			.extendMarkRange("link")
			.setLink({ href: trimmed })
			.run();
		setOpen(false);
	};

	const removeLink = () => {
		editor.chain().focus().extendMarkRange("link").unsetLink().run();
		setUrl("");
		setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					type="button"
					variant={isActive ? "default" : "ghost"}
					size="icon-sm"
					onMouseDown={(event) => {
						event.preventDefault();
					}}
					disabled={disabled}
					aria-label="Link"
					aria-pressed={isActive}
					className="size-8 shrink-0"
				>
					<LinkIcon weight="bold" />
				</Button>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-80 space-y-3">
				<div className="space-y-2">
					<label
						htmlFor="rich-text-editor-link-url"
						className="text-sm font-medium"
					>
						Link URL
					</label>
					<Input
						id="rich-text-editor-link-url"
						value={url}
						onChange={(event) => setUrl(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === "Enter") {
								event.preventDefault();
								applyLink();
							}
						}}
						placeholder="https://example.com"
						disabled={disabled}
					/>
				</div>
				<div className="flex items-center justify-end gap-2">
					{isActive ? (
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={removeLink}
							disabled={disabled}
						>
							<LinkBreakIcon />
							Remove
						</Button>
					) : null}
					<Button
						type="button"
						size="sm"
						onClick={applyLink}
						disabled={disabled}
					>
						Apply
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	);
}
