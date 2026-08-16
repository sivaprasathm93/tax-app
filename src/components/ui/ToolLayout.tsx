import { ReactNode, memo } from "react";

interface Props {
  /** The primary form. Sits top-left and is always visible. */
  form: ReactNode;
  /** The live answer. Sticky beside the form on desktop, under it on mobile. */
  result: ReactNode;
  /** Collapsible detail below the form. */
  children?: ReactNode;
}

/**
 * The two-column shape shared by every calculator in the suite: required
 * inputs top-left, the answer to their right and sticky, optional detail
 * folded away underneath. On mobile the result deliberately falls directly
 * under the first input rather than at the foot of the page, so it is never
 * hunted for.
 */
export const ToolLayout = memo(function ToolLayout({
  form,
  result,
  children,
}: Props) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <div className="lg:col-start-1 lg:row-start-1">{form}</div>
      <div className="lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-6">
        {result}
      </div>
      {children && (
        <div className="lg:col-start-1 lg:row-start-2 space-y-3">{children}</div>
      )}
    </div>
  );
});
