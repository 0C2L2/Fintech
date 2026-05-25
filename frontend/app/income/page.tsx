"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import { Income } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Filter, Banknote } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function IncomePage() {
  const [incomeRecords, setIncomeRecords] = useState<Income[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [filterMonth, setFilterMonth] = useState("");
  
  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [currentIncome, setCurrentIncome] = useState<Income | null>(null);
  const [formData, setFormData] = useState({
    amount: "",
    source: "",
    income_month: new Date().toISOString().slice(0, 7) + "-01",
    note: ""
  });

  const fetchIncome = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      if (filterMonth) params.month = filterMonth + "-01";
      
      const res = await api.income.list(params);
      if (res.success && res.data) {
        setIncomeRecords(res.data.income);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load income records");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIncome();
  }, [filterMonth]);

  const handleOpenCreate = () => {
    setCurrentIncome(null);
    setFormData({
      amount: "",
      source: "",
      income_month: new Date().toISOString().slice(0, 7) + "-01",
      note: ""
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (income: Income) => {
    setCurrentIncome(income);
    setFormData({
      amount: income.amount.toString(),
      source: income.source,
      income_month: income.income_month,
      note: income.note || ""
    });
    setIsFormOpen(true);
  };

  const handleOpenDelete = (income: Income) => {
    setCurrentIncome(income);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.income_month || !formData.source) return;
    
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      if (currentIncome) {
        await api.income.update(currentIncome.id, payload);
        toast.success("Income record updated");
      } else {
        await api.income.create(payload);
        toast.success("Income record added");
      }
      
      setIsFormOpen(false);
      fetchIncome();
    } catch (err: any) {
      toast.error(err.message || "Failed to save income record");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentIncome) return;
    setIsSubmitting(true);
    try {
      await api.income.delete(currentIncome.id);
      toast.success("Income record deleted");
      setIsDeleteOpen(false);
      fetchIncome();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete income record");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Income</h1>
            <p className="text-slate-500">Track your earnings from various sources.</p>
          </div>
          <Button onClick={handleOpenCreate} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="mr-2 h-4 w-4" /> Add Income
          </Button>
        </div>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle>Income History</CardTitle>
              
              <div className="flex items-center space-x-2">
                <Label htmlFor="month-filter" className="sr-only">Month</Label>
                <Input 
                  id="month-filter" 
                  type="month" 
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="w-[150px] h-9"
                />
                {filterMonth && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-9 px-2 text-slate-500"
                    onClick={() => setFilterMonth("")}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : incomeRecords.length === 0 ? (
              <div className="text-center py-12 px-4 shadow-sm border border-dashed rounded-lg">
                <Banknote className="mx-auto h-8 w-8 text-slate-300 mb-3" />
                <h3 className="text-lg font-medium text-slate-900">No income records found</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Start tracking your extra earnings today.
                </p>
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50">
                      <TableHead>Month</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incomeRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {new Date(record.income_month).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700">
                            {record.source}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-600">{record.note}</TableCell>
                        <TableCell className="text-right font-semibold text-emerald-600">
                          +${record.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(record)} className="h-8 w-8 text-slate-500 hover:text-emerald-600">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleOpenDelete(record)} className="h-8 w-8 text-slate-500 hover:text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Income Form Modal */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{currentIncome ? 'Edit Income' : 'Add Income'}</DialogTitle>
              <DialogDescription>
                Record your earnings from jobs, sales, or other sources.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount ($)</Label>
                  <Input 
                    id="amount" 
                    type="number" 
                    step="0.01"
                    min="0"
                    placeholder="0.00" 
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="source">Source</Label>
                  <Input 
                    id="source" 
                    placeholder="e.g. Salary, Etsy Sale, Side Job" 
                    value={formData.source}
                    onChange={(e) => setFormData({...formData, source: e.target.value})}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="income_month">Month</Label>
                  <Input 
                    id="income_month" 
                    type="date"
                    value={formData.income_month}
                    onChange={(e) => setFormData({...formData, income_month: e.target.value})}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="note">Note (Optional)</Label>
                  <Input 
                    id="note" 
                    placeholder="Any additional details" 
                    value={formData.note}
                    onChange={(e) => setFormData({...formData, note: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={isSubmitting}>
                  {currentIncome ? 'Save Changes' : 'Add Income'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Modal */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Income Record</DialogTitle>
              <DialogDescription className="mt-2">
                Are you sure you want to delete this income record of <span className="font-bold text-slate-900">${currentIncome?.amount?.toFixed(2)}</span>?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isSubmitting}>Cancel</Button>
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={isSubmitting}>Delete Income</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
