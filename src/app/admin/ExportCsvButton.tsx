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
    } catch (e: any) {
      toast.error(e.message || "Failed to export CSV", { id: "export" });
    }
  };

  return (
    <Button variant="secondary" onClick={onExport}>
      Export CSV
    </Button>
  );
}
