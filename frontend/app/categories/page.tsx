"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import { Category } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Edit, Plus, Trash2, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [threshold, setThreshold] = useState("0");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const res = await api.categories.list();
      if (res.success && res.data) {
        setCategories(res.data);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load categories");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    try {
      await api.categories.create({ 
        name: name.trim(),
        threshold: parseFloat(threshold) || 0
      });
      toast.success("Category created");
      setIsCreateOpen(false);
      setName("");
      setThreshold("0");
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message || "Failed to create category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCategory || !name.trim()) return;
    
    setIsSubmitting(true);
    try {
      await api.categories.update(currentCategory.id, { 
        name: name.trim(),
        threshold: parseFloat(threshold) || 0
      });
      toast.success("Category updated");
      setIsEditOpen(false);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message || "Failed to update category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentCategory) return;
    
    setIsSubmitting(true);
    try {
      await api.categories.delete(currentCategory.id);
      toast.success("Category deleted");
      setIsDeleteOpen(false);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete category");
    } finally {
      setIsSubmitting(false);
    }
  };

   const openEdit = (cat: Category) => {
    setCurrentCategory(cat);
    setName(cat.name);
    setThreshold((cat.threshold || 0).toString());
    setIsEditOpen(true);
  };

  const openDelete = (cat: Category) => {
    setCurrentCategory(cat);
    setIsDeleteOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Categories</h1>
            <p className="text-slate-500">Manage your expense and income categories.</p>
          </div>
           <Button onClick={() => { setName(""); setThreshold("0"); setIsCreateOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> New Category
          </Button>
        </div>

        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle>Your Categories</CardTitle>
            <CardDescription>
              Default categories cannot be renamed or deleted. Deleting a custom category will move its expenses to "Other".
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center p-8 text-slate-500">
                No categories found.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((cat) => (
                    <div key={cat.id} className="flex flex-col gap-3 p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
                            <Tag className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{cat.name}</p>
                            {cat.is_default === 1 && (
                              <Badge variant="secondary" className="mt-1 text-xs px-1.5 py-0">Default</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(cat)} className="h-8 w-8 text-slate-500 hover:text-blue-600">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {cat.is_default === 0 && cat.name !== "Other" && (
                            <Button variant="ghost" size="icon" onClick={() => openDelete(cat)} className="h-8 w-8 text-slate-500 hover:text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t flex items-center justify-between text-sm">
                        <div className="text-slate-500 flex flex-col">
                          <span>
                            {cat.threshold && cat.threshold > 0 ? "Budget: " : "Threshold: "}
                            <span className="font-semibold text-slate-900">${cat.threshold || 0}</span>
                          </span>
                          {(cat.threshold === 0 || !cat.threshold) && cat.default_threshold_percent && cat.default_threshold_percent > 0 && (
                            <span className="text-[10px] text-blue-500 font-medium italic">
                              AI Limit: {Math.round(cat.default_threshold_percent * 100)}% 
                              {cat.suggested_threshold && cat.suggested_threshold > 0 ? ` (~$${Math.round(cat.suggested_threshold)})` : ""}
                            </span>
                          )}
                        </div>
                        <div className="text-slate-500">
                          Last Month: <span className={`font-semibold ${ (cat.last_month_spent || 0) > (cat.threshold || 0) && (cat.threshold || 0) > 0 ? "text-red-500" : "text-slate-900"}`}>
                            ${(cat.last_month_spent || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Modal */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Category</DialogTitle>
              <DialogDescription>Add a new category to organize your spending.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="space-y-4 py-4">
                 <div className="space-y-2">
                  <Label htmlFor="create-name">Name</Label>
                  <Input 
                    id="create-name" 
                    placeholder="e.g., Subscriptions" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-threshold">Monthly Threshold ($)</Label>
                  <Input 
                    id="create-threshold" 
                    type="number"
                    min="0"
                    step="1"
                    value={threshold} 
                    onChange={(e) => setThreshold(e.target.value)}
                  />
                  <p className="text-xs text-slate-500">Set to 0 for no custom limit.</p>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting || !name.trim()}>Create</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Modal */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>Update the name of this category.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEdit}>
              <div className="space-y-4 py-4">
                 <div className="space-y-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input 
                    id="edit-name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={currentCategory?.is_default === 1 || currentCategory?.name === "Other"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-threshold">Monthly Threshold ($)</Label>
                  <Input 
                    id="edit-threshold" 
                    type="number"
                    min="0"
                    step="1"
                    value={threshold} 
                    onChange={(e) => setThreshold(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting || !name.trim()}>Save Changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Modal */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Category</DialogTitle>
              <DialogDescription className="text-red-600 font-medium mt-2">
                Warning: Any expenses associated with "{currentCategory?.name}" will be moved to the "Other" category.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isSubmitting}>Cancel</Button>
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={isSubmitting}>Delete Category</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
