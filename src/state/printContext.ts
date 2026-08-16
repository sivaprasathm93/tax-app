import { ReactNode, createContext, useContext } from "react";

export interface PrintContextValue {
  print: (node: ReactNode, filename: string) => void;
  /** True while a document is staged, so callers can disable their button. */
  printing: boolean;
}

/** Split from PrintProvider for the same Fast Refresh reason as ProfileContext. */
export const PrintContext = createContext<PrintContextValue | null>(null);

export function usePrint(): PrintContextValue {
  const context = useContext(PrintContext);
  if (!context) {
    throw new Error("usePrint must be used inside a PrintProvider");
  }
  return context;
}
