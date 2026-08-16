import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { PrintContext, PrintContextValue } from "./printContext";

interface PrintJob {
  node: ReactNode;
  /** Becomes the suggested PDF filename in every browser's print dialog. */
  filename: string;
}

/**
 * Renders a document off-screen and hands it to the browser's own print
 * dialog, where "Save as PDF" is one of the destinations.
 *
 * A PDF library would be the obvious alternative, and was rejected: jsPDF or
 * pdfmake is roughly 300 KB of bundle for output that would still have to be
 * laid out twice, once in HTML for the screen and again in the library's own
 * drawing API. Printing renders the same markup the rest of the app uses, and
 * keeps the promise that nothing leaves the device - the file is written by
 * the browser, not by us.
 *
 * The document title is what browsers pre-fill as the filename, so it is
 * swapped for the duration of the dialog and restored afterwards.
 */
export function PrintProvider({ children }: { children: ReactNode }) {
  const [job, setJob] = useState<PrintJob | null>(null);

  const print = useCallback((node: ReactNode, filename: string) => {
    setJob({ node, filename });
  }, []);

  useEffect(() => {
    if (!job) return;

    const previousTitle = document.title;
    document.title = job.filename;

    // A timer rather than requestAnimationFrame. This effect already runs
    // after React has committed the document into the print root, so the only
    // thing left to wait for is layout - and rAF does not fire at all in a
    // tab the browser is not compositing, which would leave someone who
    // switched away mid-click with a document that never printed and a
    // window title still reading as the filename.
    const timer = window.setTimeout(() => {
      window.print();
      document.title = previousTitle;
      setJob(null);
    }, 60);

    return () => {
      window.clearTimeout(timer);
      document.title = previousTitle;
    };
  }, [job]);

  const value = useMemo<PrintContextValue>(
    () => ({ print, printing: job !== null }),
    [print, job]
  );

  return (
    <PrintContext.Provider value={value}>
      {children}
      {/* Hidden on screen, and the only thing visible on paper - see the
          @media print block in index.css. */}
      <div id="print-root" aria-hidden="true">
        {job?.node}
      </div>
    </PrintContext.Provider>
  );
}
