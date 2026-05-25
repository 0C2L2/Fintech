"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Download,
  FileSpreadsheet,
  Calendar,
  Info,
  CheckCircle2,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

async function triggerExcelDownload(month: string): Promise<void> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("You must be logged in.");

  const response = await fetch(
    `${API_BASE}/reports/excel?month=${encodeURIComponent(month)}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    let msg = `Error ${response.status}`;
    try {
      const j = await response.json();
      msg = j.message || msg;
    } catch {}
    throw new Error(msg);
  }

  // Read as ArrayBuffer — most reliable for binary
  const arrayBuffer = await response.arrayBuffer();

  if (arrayBuffer.byteLength === 0) {
    throw new Error("Server returned an empty file.");
  }

  // Validate XLSX magic bytes: PK (0x50 0x4B 0x03 0x04)
  const bytes = new Uint8Array(arrayBuffer);
  if (!(bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04)) {
    throw new Error("Server returned an invalid file.");
  }

  // Build the filename — always end with .xlsx
  const yearMonth = month.slice(0, 7).replace(/-/g, ""); // "202605"
  const filename = `finhealth_report_${yearMonth}.xlsx`;

  // Create blob with explicit XLSX MIME type
  const blob = new Blob([arrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  // ---- Reliable download trigger ----
  const blobUrl = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename; // must set BEFORE appending/clicking
  link.rel = "noopener";
  link.style.position = "fixed";
  link.style.top = "-9999px";
  link.style.left = "-9999px";

  document.body.appendChild(link);
  link.click(); // synchronous click triggers download with correct filename

  // Revoke after a generous delay so the browser has time to start the download
  window.setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
  }, 10_000);
}

const SHEETS = [
  { icon: "📊", name: "Summary", desc: "Income, expenses, savings rate & financial score" },
  { icon: "🗂️", name: "Category Breakdown", desc: "Spending by category with share %" },
  { icon: "📈", name: "Monthly History", desc: "Last 12 months of financial data" },
  { icon: "⚠️", name: "Alerts", desc: "Overspending flags and severity levels" },
  { icon: "💡", name: "Recommendations", desc: "Tailored advice to improve your finances" },
];

export default function ReportsPage() {
  const [targetMonth, setTargetMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [isDownloading, setIsDownloading] = useState(false);
  const [lastDownloaded, setLastDownloaded] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!targetMonth) {
      toast.error("Please select a month first.");
      return;
    }
    setIsDownloading(true);
    try {
      const monthParam = `${targetMonth}-01`;
      await triggerExcelDownload(monthParam);
      setLastDownloaded(targetMonth);
      toast.success("Report downloaded!", {
        description: `finhealth_report_${targetMonth.replace(/-/g, "")}.xlsx`,
        duration: 5000,
      });
    } catch (err: any) {
      toast.error("Download failed", {
        description: err.message || "An unexpected error occurred.",
        duration: 6000,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reports</h1>
          <p className="text-slate-500 mt-1">Export your financial data as a formatted Excel workbook.</p>
        </div>

        {/* Download card */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl">Excel Report Export</CardTitle>
                <CardDescription>Download a comprehensive .xlsx workbook</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="report-month" className="flex items-center gap-1.5 text-sm font-medium">
                <Calendar className="h-4 w-4 text-slate-400" />
                Report Month
              </Label>
              <Input
                id="report-month"
                type="month"
                value={targetMonth}
                onChange={(e) => setTargetMonth(e.target.value)}
                className="max-w-xs"
                disabled={isDownloading}
              />
              {targetMonth && (
                <p className="text-xs text-slate-400">
                  File will be saved as:{" "}
                  <span className="font-mono font-medium text-slate-600">
                    finhealth_report_{targetMonth.replace(/-/g, "")}.xlsx
                  </span>
                </p>
              )}
            </div>

            <Button
              id="download-excel-btn"
              onClick={handleDownload}
              disabled={isDownloading || !targetMonth}
              className="w-full h-12 text-base bg-emerald-600 hover:bg-emerald-700"
            >
              {isDownloading ? (
                <>
                  <svg className="animate-spin mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating report…
                </>
              ) : (
                <>
                  <Download className="mr-2 h-5 w-5" />
                  Download Excel (.xlsx)
                </>
              )}
            </Button>

            {lastDownloaded && (
              <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>
                  Downloaded:{" "}
                  <strong>
                    finhealth_report_{lastDownloaded.replace(/-/g, "")}.xlsx
                  </strong>
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* What's included */}
        <Card className="shadow-sm border-slate-200 bg-slate-50/60">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-slate-400" />
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Workbook contents — 5 sheets
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {SHEETS.map((s) => (
                <li key={s.name} className="flex items-start gap-3">
                  <span className="text-lg leading-tight">{s.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
