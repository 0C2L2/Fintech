"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Database, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function DatabaseExplorerPage() {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTables, setLoadingTables] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    setLoadingTables(true);
    try {
      const res = await api.admin.dbTables();
      if (res.success) {
        setTables(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch tables:", err);
      toast.error("Failed to load database tables");
    } finally {
      setLoadingTables(false);
    }
  };

  const fetchTableData = async (tableName: string) => {
    if (!tableName) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.admin.dbData(tableName);
      if (res.success) {
        setData(res.data);
        if (res.data.length === 0) {
          setError("No data found in this table.");
        }
      }
    } catch (err: any) {
      console.error("Failed to fetch table data:", err);
      setError(err.message || "An error occurred while fetching table data.");
      toast.error("Error loading table data");
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (value: string | null) => {
    if (!value) return;
    setSelectedTable(value);
    fetchTableData(value);
  };

  const renderValue = (val: any) => {
    if (val === null || val === undefined) return <span className="text-slate-400 italic">NULL</span>;
    if (typeof val === "object") return <pre className="text-[10px] bg-slate-100 p-1 rounded overflow-hidden max-w-[200px] whitespace-pre-wrap">{JSON.stringify(val, null, 2)}</pre>;
    if (typeof val === "boolean") return val ? "true" : "false";
    return String(val);
  };

  // Extract keys for column headers
  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Database Explorer</h1>
            <p className="text-slate-500">Browse raw data from system tables (Admin only).</p>
          </div>
          <Button variant="outline" size="icon" onClick={() => fetchTableData(selectedTable)} disabled={!selectedTable || loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <Card className="border-slate-200">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-4">
              <div className="w-[280px]">
                <Select onValueChange={handleTableChange} value={selectedTable} disabled={loadingTables}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingTables ? "Loading tables..." : "Select a table to browse"} />
                  </SelectTrigger>
                  <SelectContent>
                    {tables.map(table => (
                      <SelectItem key={table} value={table}>
                        <div className="flex items-center">
                          <Database className="h-4 w-4 mr-2 text-slate-400" />
                          {table}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Loader2 className="h-10 w-10 animate-spin mb-4 text-blue-600" />
                <p>Retrieving data from {selectedTable}...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500 border-2 border-dashed rounded-lg bg-slate-50">
                <AlertCircle className="h-10 w-10 mb-4 text-slate-300" />
                <p className="font-medium">{error}</p>
                {selectedTable && <p className="text-sm mt-1">Try another table or check connection.</p>}
              </div>
            ) : !selectedTable ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500 border-2 border-dashed rounded-lg bg-slate-50">
                <Database className="h-10 w-10 mb-4 text-slate-300" />
                <p className="font-medium">No table selected</p>
                <p className="text-sm mt-1">Choose a table above to inspect its contents.</p>
              </div>
            ) : (
              <div className="border rounded-md overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      {columns.map(col => (
                        <TableHead key={col} className="font-bold text-slate-700 whitespace-nowrap">
                          {col.toUpperCase()}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((row, idx) => (
                      <TableRow key={idx} className="hover:bg-slate-50">
                        {columns.map(col => (
                          <TableCell key={col} className="text-sm">
                            {renderValue(row[col])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            
            {data.length > 0 && (
              <div className="mt-4 text-xs text-slate-400">
                Showing first 100 entries from <strong>{selectedTable}</strong>.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
