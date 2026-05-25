"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import { Expense, Category } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Filter } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [filterMonth, setFilterMonth] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  
  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [currentExpense, setCurrentExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({
    category_id: "",
    amount: "",
    expense_type: "expense",
    expense_month: new Date().toISOString().slice(0, 7) + "-01", // YYYY-MM-01
    note: ""
  });

  const fetchCategories = async () => {
    try {
      const res = await api.categories.list();
      if (res.success && res.data) {
        setCategories(res.data);
        if (res.data.length > 0 && !formData.category_id) {
          setFormData(prev => ({ ...prev, category_id: res.data[0].id }));
        }
      }
    } catch (err: any) {
      toast.error("Failed to load categories");
    }
  };

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      if (filterMonth) params.month = filterMonth + "-01";
      if (filterCategory !== "all") params.category = filterCategory;
      
      const res = await api.expenses.list(params);
      if (res.success && res.data) {
        setExpenses(res.data.expenses);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load expenses");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [filterMonth, filterCategory]);

  const handleOpenCreate = () => {
    setCurrentExpense(null);
    setFormData({
      category_id: categories.length > 0 ? categories[0].id : "",
      amount: "",
      expense_type: "expense",
      expense_month: new Date().toISOString().slice(0, 7) + "-01",
      note: ""
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (expense: Expense) => {
    setCurrentExpense(expense);
    setFormData({
      category_id: expense.category_id,
      amount: expense.amount.toString(),
      expense_type: expense.expense_type,
      expense_month: expense.expense_month,
      note: expense.note || ""
    });
    setIsFormOpen(true);
  };

  const handleOpenDelete = (expense: Expense) => {
    setCurrentExpense(expense);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category_id || !formData.amount || !formData.expense_month) return;
    
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      if (currentExpense) {
        await api.expenses.update(currentExpense.id, payload);
        toast.success("Expense updated");
      } else {
        await api.expenses.create(payload);
        toast.success("Expense added");
      }
      
      setIsFormOpen(false);
      fetchExpenses();
    } catch (err: any) {
      toast.error(err.message || "Failed to save expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentExpense) return;
    setIsSubmitting(true);
    try {
      await api.expenses.delete(currentExpense.id);
      toast.success("Expense deleted");
      setIsDeleteOpen(false);
      fetchExpenses();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMonthFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // format YYYY-MM
    setFilterMonth(val);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Expenses</h1>
            <p className="text-slate-500">Track and manage your daily spending.</p>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Expense
          </Button>
        </div>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle>Expense History</CardTitle>
              
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="month-filter" className="sr-only">Month</Label>
                  <Input 
                    id="month-filter" 
                    type="month" 
                    value={filterMonth}
                    onChange={handleMonthFilterChange}
                    className="w-[150px] h-9"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Select value={filterCategory} onValueChange={(val) => setFilterCategory(val || "")}>
                    <SelectTrigger className="w-[180px] h-9">
                      <SelectValue placeholder="All Categories">
                        {filterCategory === "all" ? "All Categories" : categories.find(c => c.id === filterCategory)?.name}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {(filterMonth || filterCategory !== "all") && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-9 px-2 text-slate-500"
                    onClick={() => { setFilterMonth(""); setFilterCategory("all"); }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-12 px-4 shadow-sm border border-dashed rounded-lg">
                <Filter className="mx-auto h-8 w-8 text-slate-300 mb-3" />
                <h3 className="text-lg font-medium text-slate-900">No expenses found</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Try adjusting your filters or click "Add Expense" to get started.
                </p>
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50">
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="font-medium">
                          {new Date(expense.expense_month).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                            {expense.category_name}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-600">{expense.note}</TableCell>
                        <TableCell className="text-right font-semibold">
                          ${expense.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(expense)} className="h-8 w-8 text-slate-500 hover:text-blue-600">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleOpenDelete(expense)} className="h-8 w-8 text-slate-500 hover:text-red-600">
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

        {/* Expense Form Modal */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{currentExpense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
              <DialogDescription>
                Enter the details of your transaction below.
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
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={formData.category_id} 
                    onValueChange={(val) => setFormData({...formData, category_id: val || ""})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category">
                        {categories.find(c => c.id === formData.category_id)?.name}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expense_month">Month</Label>
                  <Input 
                    id="expense_month" 
                    type="date"
                    value={formData.expense_month}
                    onChange={(e) => setFormData({...formData, expense_month: e.target.value})}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="note">Note (Optional)</Label>
                  <Input 
                    id="note" 
                    placeholder="E.g., Groceries from Whole Foods" 
                    value={formData.note}
                    onChange={(e) => setFormData({...formData, note: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {currentExpense ? 'Save Changes' : 'Add Expense'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Modal */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Expense</DialogTitle>
              <DialogDescription className="mt-2">
                Are you sure you want to delete this expense of <span className="font-bold text-slate-900">${currentExpense?.amount?.toFixed(2)}</span>? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isSubmitting}>Cancel</Button>
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={isSubmitting}>Delete Expense</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
