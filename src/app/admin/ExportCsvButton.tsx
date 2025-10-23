"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ExportCsvButton() {
  const onExport = async () => {
    try {
      toast.loading("Preparing CSV…", { id: "export" });
      const res = await fetch("/api/reports/commission");
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to export CSV");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const ts = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `commissions_${ts}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("CSV downloaded", { id: "export" });
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Failed to export CSV";
      toast.error(errorMessage, { id: "export" });
    }
  };

  return (
    <Button variant="secondary" onClick={onExport} aria-label="Export CSV">
      {/* download icon */}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 mr-2">
        <path d="M12 3a1 1 0 0 1 1 1v8.586l2.293-2.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4A1 1 0 0 1 8.707 10.293L11 12.586V4a1 1 0 0 1 1-1z" />
        <path d="M5 20a1 1 0 0 1 0-2h14a1 1 0 1 1 0 2H5z" />
      </svg>
      <span className="hidden sm:inline">Export CSV</span>
    </Button>
  );
}
