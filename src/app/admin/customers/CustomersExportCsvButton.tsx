"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Row = { name: string; email: string; deposited: number; commission: number };

export default function CustomersExportCsvButton({ rows }: { rows: Row[] }) {
  const onExport = async () => {
    try {
      toast.loading("Preparing customers CSV…", { id: "customers-export" });
      const headers = ["Name", "Email", "Deposited(Naira)", "Commission(Naira)"];
      const lines = [headers.join(",")].concat(
        rows.map((r) => [r.name, r.email, String(r.deposited), String(r.commission)].map(csvEscape).join(","))
      );
      const csv = lines.join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const ts = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `customers_${ts}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Customers CSV downloaded", { id: "customers-export" });
    } catch (e: any) {
      toast.error(e.message || "Failed to export customers CSV", { id: "customers-export" });
    }
  };

  return (
    <Button variant="secondary" size="sm" onClick={onExport} aria-label="Export customers CSV">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 mr-2">
        <path d="M12 3a1 1 0 0 1 1 1v8.586l2.293-2.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4A1 1 0 0 1 8.707 10.293L11 12.586V4a1 1 0 0 1 1-1z" />
        <path d="M5 20a1 1 0 0 1 0-2h14a1 1 0 1 1 0 2H5z" />
      </svg>
      <span className="hidden sm:inline">Export CSV</span>
    </Button>
  );
}

function csvEscape(v: string) {
  if (v == null) return "";
  if (/[",\n]/.test(v)) return '"' + v.replace(/"/g, '""') + '"';
  return v;
}
