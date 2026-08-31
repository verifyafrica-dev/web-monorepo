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
	ComboboxLabel,
	ComboboxList,
	ComboboxSeparator,
	ComboboxValue,
	useComboboxAnchor,
} from "../ui/combobox";
import {
	formatShuftiAddressDocumentTypeLabel,
	getShuftiAddressSupportedTypeGroups,
	type ShuftiAddressSupportedType,
	type ShuftiAddressSupportedTypeGroup,
} from "../../lib/constants";

type AddressDocumentTypesMultiComboboxProps = {
	id?: string;
	value: string[];
	onValueChange: (value: string[]) => void;
	placeholder?: string;
	disabled?: boolean;
	options?: readonly string[];
};

type AddressDocumentTypeComboboxProps = {
	id?: string;
	value: string;
	onValueChange: (value: string) => void;
	placeholder?: string;
	disabled?: boolean;
	options?: readonly string[];
};

function itemLabel(item: string) {
	return formatShuftiAddressDocumentTypeLabel(item);
}

export function AddressDocumentTypesMultiCombobox({
	id,
	value,
	onValueChange,
	placeholder = "Search document types",
	disabled = false,
	options,
}: AddressDocumentTypesMultiComboboxProps) {
	const groups = getShuftiAddressSupportedTypeGroups(options);
	const chipsAnchor = useComboboxAnchor();

	return (
		<Combobox
			items={groups}
			multiple
			value={value}
			onValueChange={(next) => onValueChange(next as string[])}
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
			<AddressDocumentTypeList
				anchor={chipsAnchor}
				groups={groups}
			/>
		</Combobox>
	);
}

export function AddressDocumentTypeCombobox({
	id,
	value,
	onValueChange,
	placeholder = "Select document type",
	disabled = false,
	options,
}: AddressDocumentTypeComboboxProps) {
	const groups = getShuftiAddressSupportedTypeGroups(options);

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
			<AddressDocumentTypeList groups={groups} />
		</Combobox>
	);
}

function AddressDocumentTypeList({
	groups,
	anchor,
}: {
	groups: ShuftiAddressSupportedTypeGroup[];
	anchor?: ReturnType<typeof useComboboxAnchor>;
}) {
	return (
		<ComboboxContent anchor={anchor} className="min-w-(--anchor-width)">
			<ComboboxEmpty>No document types found.</ComboboxEmpty>
			<ComboboxList>
				{(group: ShuftiAddressSupportedTypeGroup) => (
					<ComboboxGroup key={group.value} items={group.items}>
						{group.value === "More" ? <ComboboxSeparator /> : null}
						<ComboboxLabel>{group.value}</ComboboxLabel>
						<ComboboxCollection>
							{(item: ShuftiAddressSupportedType) => (
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
