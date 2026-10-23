import { createContext, useContext } from "react";

export type MixedContinueContextValue = {
	isMixed: boolean;
	hasNextStep: boolean;
	onContinue: () => void;
};

const MixedContinueContext = createContext<MixedContinueContextValue | null>(
	null,
);

export function MixedContinueProvider({
	value,
	children,
}: {
	value: MixedContinueContextValue | null;
	children: React.ReactNode;
}) {
	return (
		<MixedContinueContext.Provider value={value}>
			{children}
		</MixedContinueContext.Provider>
	);
}

export function useMixedContinue() {
	return useContext(MixedContinueContext);
}
