import { EyeIcon, EyeSlashIcon, LockIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Input } from "@verifyafrica/ui/components/ui/input";
import { Label } from "@verifyafrica/ui/components/ui/label";

export function PasswordField({
	id,
	label,
	placeholder = "Enter your password",
	value,
	onChange,
}: {
	id: string;
	label: string;
	placeholder?: string;
	value?: string;
	onChange?: (value: string) => void;
}) {
	const [visible, setVisible] = useState(false);

	return (
		<div className="space-y-1.5">
			<Label htmlFor={id}>{label}</Label>
			<div className="relative">
				<LockIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					id={id}
					type={visible ? "text" : "password"}
					placeholder={placeholder}
					className="pr-10 pl-10"
					value={value}
					onChange={
						onChange ? (event) => onChange(event.target.value) : undefined
					}
				/>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
					onClick={() => setVisible((current) => !current)}
					aria-label={visible ? "Hide password" : "Show password"}
				>
					{visible ? (
						<EyeSlashIcon className="size-4" />
					) : (
						<EyeIcon className="size-4" />
					)}
				</Button>
			</div>
		</div>
	);
}
