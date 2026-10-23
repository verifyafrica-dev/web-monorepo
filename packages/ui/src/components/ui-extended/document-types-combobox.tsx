"use client";

import {
	Combobox,
	ComboboxChip,
	ComboboxChips,
	ComboboxChipsInput,
	ComboboxCollection,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxGroup,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
	ComboboxValue,
	useComboboxAnchor,
} from "../ui/combobox";
import {
	formatShuftiDocumentTypeLabel,
	SHUFTI_DOCUMENT_SUPPORTED_TYPES,
	type ShuftiDocumentSupportedType,
} from "../../lib/constants";

type DocumentTypesMultiComboboxProps = {
	id?: string;
	value: string[];
	onValueChange: (value: string[]) => void;
	placeholder?: string;
	disabled?: boolean;
	options?: readonly string[];
};

type DocumentTypeComboboxProps = {
	id?: string;
	value: string;
	onValueChange: (value: string) => void;
	placeholder?: string;
	disabled?: boolean;
	options?: readonly string[];
};

type DocumentTypeGroup = {
	value: string;
	items: ShuftiDocumentSupportedType[];
};

function itemLabel(item: string) {
	return formatShuftiDocumentTypeLabel(item);
}

function resolveOptions(options?: readonly string[]): ShuftiDocumentSupportedType[] {
	if (!options || options.length === 0) {
		return [...SHUFTI_DOCUMENT_SUPPORTED_TYPES];
	}
	return options.filter((item): item is ShuftiDocumentSupportedType =>
		(SHUFTI_DOCUMENT_SUPPORTED_TYPES as readonly string[]).includes(item),
	);
}

function toGroups(items: ShuftiDocumentSupportedType[]): DocumentTypeGroup[] {
	return [{ value: "Document types", items }];
}

export function DocumentTypesMultiCombobox({
	id,
	value,
	onValueChange,
	placeholder = "All document types allowed",
	disabled = false,
	options,
}: DocumentTypesMultiComboboxProps) {
	const groups = toGroups(resolveOptions(options));
	const chipsAnchor = useComboboxAnchor();

	return (
		<Combobox
			items={groups}
			multiple
			value={value}
			onValueChange={(next) => onValueChange((next as string[]) ?? [])}
			itemToStringLabel={itemLabel}
			disabled={disabled}
		>
			<ComboboxChips ref={chipsAnchor}>
				<ComboboxValue>
					{(selected: string[]) => (
						<>
							{selected.map((item) => (
								<ComboboxChip key={item} value={item}>
									{itemLabel(item)}
								</ComboboxChip>
							))}
							<ComboboxChipsInput
								id={id}
								placeholder={selected.length > 0 ? "" : placeholder}
							/>
						</>
					)}
				</ComboboxValue>
			</ComboboxChips>
			<DocumentTypeList anchor={chipsAnchor} groups={groups} />
		</Combobox>
	);
}

export function DocumentTypeCombobox({
	id,
	value,
	onValueChange,
	placeholder = "Select document type",
	disabled = false,
	options,
}: DocumentTypeComboboxProps) {
	const groups = toGroups(resolveOptions(options));

	return (
		<Combobox
			items={groups}
			value={value || null}
			onValueChange={(next) => onValueChange((next as string | null) ?? "")}
			itemToStringLabel={itemLabel}
			disabled={disabled}
		>
			<ComboboxInput
				id={id}
				placeholder={placeholder}
				showTrigger
				disabled={disabled}
			/>
			<DocumentTypeList groups={groups} />
		</Combobox>
	);
}

function DocumentTypeList({
	anchor,
	groups,
}: {
	anchor?: ReturnType<typeof useComboboxAnchor>;
	groups: DocumentTypeGroup[];
}) {
	return (
		<ComboboxContent anchor={anchor} className="min-w-(--anchor-width)">
			<ComboboxEmpty>No document types found.</ComboboxEmpty>
			<ComboboxList>
				{(group: DocumentTypeGroup) => (
					<ComboboxGroup key={group.value} items={group.items}>
						<ComboboxCollection>
							{(item: ShuftiDocumentSupportedType) => (
								<ComboboxItem key={item} value={item}>
									{itemLabel(item)}
								</ComboboxItem>
							)}
						</ComboboxCollection>
					</ComboboxGroup>
				)}
			</ComboboxList>
		</ComboboxContent>
	);
}
