"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import { DashboardData } from "@/types";
import { 
  Wallet, 
  TrendingDown, 
  TrendingUp, 
  PiggyBank, 
  AlertTriangle,
  Lightbulb,
  ArrowRight
} from "lucide-react";
import { SummaryCard } from "@/components/SummaryCard";
import { SpendingPieChart } from "@/components/SpendingPieChart";
import { TrendLineChart } from "@/components/TrendLineChart";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      // Fetch for current month by default
      const res = await api.analytics.dashboard();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchDashboardData} className="mt-4">Try Again</Button>
      </DashboardLayout>
    );
  }

  if (!data) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
            <p className="text-slate-500">Your financial health at a glance.</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-white px-3 py-1 text-sm border-blue-200 text-blue-700">
              Segment: {data.segment?.label || "Uncategorized"}
            </Badge>
          </div>
        </div>

        {/* Action needed banner if there are critical alerts */}
        {data.alerts && data.alerts.some(a => a.severity === 'critical' || a.severity === 'high') && (
          <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <AlertTitle className="text-red-800 font-semibold">Attention Needed</AlertTitle>
            <AlertDescription className="text-red-700 mt-1">
              You have critical overspending alerts this month. Please review your Analysis page.
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard 
            title="Total Expenses" 
            value={`$${(data.summary.total_expense || 0).toFixed(2)}`}
            icon={TrendingDown}
          />
          <SummaryCard 
            title="Total Income" 
            value={`$${(data.summary.income || 0).toFixed(2)}`}
            icon={Wallet}
          />
          <SummaryCard 
            title="Savings Rate" 
            value={`${((data.summary.savings_rate || 0) * 100).toFixed(1)}%`}
            icon={PiggyBank}
            description="of income saved"
          />
          <SummaryCard 
            title="Predicted Next Savings" 
            value={`$${(data.prediction.predicted_savings || 0).toFixed(2)}`}
            icon={TrendingUp}
            description="AI forecast"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <SpendingPieChart data={data.charts?.category_breakdown || []} />
          </div>
          <div className="lg:col-span-2">
            <TrendLineChart data={data.charts?.history || []} />
          </div>
        </div>

        {/* Bottom Row - Recommendations & Recent */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">Recommendations</CardTitle>
              <Link href="/analysis">
                <Button variant="ghost" size="sm" className="text-blue-600">View All <ArrowRight className="h-4 w-4 ml-1" /></Button>
              </Link>
            </CardHeader>
            <CardContent>
              {data.recommendations && data.recommendations.length > 0 ? (
                <div className="space-y-4 pt-2">
                  {data.recommendations.slice(0, 2).map((rec, idx) => (
                     <div key={idx} className="flex gap-4 items-start p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                       <div className="mt-1 p-2 bg-blue-100 rounded-full text-blue-600">
                         <Lightbulb className="h-4 w-4" />
                       </div>
                       <div>
                         <h4 className="font-semibold text-slate-900">{rec.title}</h4>
                         <p className="text-sm text-slate-600 mt-1">{rec.action}</p>
                       </div>
                     </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500">
                  <p>You're on track! No urgent recommendations at this time.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">Recent Expenses</CardTitle>
              <Link href="/expenses">
                <Button variant="ghost" size="sm" className="text-blue-600">View All <ArrowRight className="h-4 w-4 ml-1" /></Button>
              </Link>
            </CardHeader>
            <CardContent>
              {data.recent_expenses && data.recent_expenses.length > 0 ? (
                <div className="space-y-4 pt-2">
                  {data.recent_expenses.slice(0, 4).map((exp) => (
                    <div key={exp.id} className="flex items-center justify-between border-b border-slate-100 last:border-0 pb-3 last:pb-0">
                      <div>
                        <p className="font-medium text-slate-900">{exp.category_name}</p>
                        <p className="text-xs text-slate-500">
                          {exp.note || exp.expense_type} • {exp.expense_month}
                        </p>
                      </div>
                      <div className="font-semibold text-slate-900">
                        ${exp.amount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500">
                  <p>No recent expenses. Go to Expenses to add one.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
