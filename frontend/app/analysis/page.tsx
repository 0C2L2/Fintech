"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import { AnalysisResult } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AlertTriangle, Info, ShieldCheck, HeartPulse, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AnalysisPage() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [targetMonth, setTargetMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [income, setIncome] = useState("");
  const [savings, setSavings] = useState("");
  const [isUpdatingSnapshot, setIsUpdatingSnapshot] = useState(false);

  const fetchSummaryAndAnalysis = async (monthStr: string) => {
    setIsLoading(true);
    try {
      const monthParam = `${monthStr}-01`;
      
      // Step 1: Get monthly summary to populate form
      const summaryRes = await api.monthlySummary.get(monthParam);
      if (summaryRes.success && summaryRes.data) {
        setIncome(summaryRes.data.income > 0 ? summaryRes.data.income.toString() : "");
        setSavings(summaryRes.data.total_savings > 0 ? summaryRes.data.total_savings.toString() : "");
      }

      // Step 2: Fetch existing analysis (from dashboard view since we didn't add a specific GET /analysis/:month)
      // Actually, we can just run analyze to get the latest fresh data
      const analysisRes = await api.analytics.analyze(monthParam);
      if (analysisRes.success && analysisRes.data) {
        setAnalysis(analysisRes.data);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load analysis");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaryAndAnalysis(targetMonth);
  }, [targetMonth]);

  const handleUpdateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingSnapshot(true);
    try {
      const monthParam = `${targetMonth}-01`;
      
      // Upsert summary
      await api.monthlySummary.upsert({
        month: monthParam,
        income: parseFloat(income) || 0,
        total_savings: parseFloat(savings) || 0
      });
      
      toast.success("Income/Savings updated");
      
      // Re-run analysis
      const analysisRes = await api.analytics.analyze(monthParam);
      if (analysisRes.success && analysisRes.data) {
        setAnalysis(analysisRes.data);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update summary");
    } finally {
      setIsUpdatingSnapshot(false);
    }
  };

  const runAnalysis = async () => {
    setIsLoading(true);
    try {
      const monthParam = `${targetMonth}-01`;
      const res = await api.analytics.analyze(monthParam);
      if (res.success && res.data) {
        setAnalysis(res.data);
        toast.success("Analysis updated successfully");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to run analysis");
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 50) return "text-amber-500";
    return "text-red-600";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Financial Analysis</h1>
          <p className="text-slate-500">AI-powered insights based on your spending patterns.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Controls & Snapshot Form */}
          <Card className="md:col-span-1 shadow-sm border-slate-200 h-fit">
            <CardHeader>
              <CardTitle>Month Settings</CardTitle>
              <CardDescription>Enter income and target savings to improve predictions.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateSnapshot} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="month">Analysis Month</Label>
                  <Input 
                    id="month" 
                    type="month" 
                    value={targetMonth}
                    onChange={(e) => setTargetMonth(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="income">Monthly Income ($)</Label>
                  <Input 
                    id="income" 
                    type="number" 
                    placeholder="e.g. 5000"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="savings">Target Savings ($)</Label>
                  <Input 
                    id="savings" 
                    type="number" 
                    placeholder="e.g. 1000"
                    value={savings}
                    onChange={(e) => setSavings(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isUpdatingSnapshot}>
                  {isUpdatingSnapshot ? "Saving..." : "Update Income & Run"}
                </Button>
                <Button type="button" variant="outline" className="w-full mt-2" onClick={runAnalysis} disabled={isLoading}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh Analysis
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Analysis Results */}
          <div className="md:col-span-2 space-y-6">
            {!analysis ? (
              <Card className="shadow-sm border-slate-200">
                <CardContent className="flex flex-col items-center justify-center p-12 text-slate-500">
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  ) : (
                    <>
                      <Info className="h-8 w-8 mb-2" />
                      <p>Run analysis to see your financial health profile.</p>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Score & Segment */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card className="shadow-sm border-slate-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-slate-500">Financial Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <div className={`text-4xl font-bold ${getScoreColor(analysis.financial_score)}`}>
                          {analysis.financial_score}
                        </div>
                        <div className="text-sm text-slate-500">
                          out of 100
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="shadow-sm border-slate-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-slate-500">Your Financial Segment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-semibold text-blue-700">
                        {analysis.cluster_label || "Uncategorized"}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Overspending Alerts */}
                {analysis.overspending_flags && analysis.overspending_flags.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center">
                      <ShieldCheck className="mr-2 h-5 w-5 text-amber-500" />
                      Attention Areas
                    </h3>
                    {analysis.overspending_flags.map((flag, idx) => (
                      <Alert key={idx} variant={flag.severity === 'critical' ? 'destructive' : 'default'} className={flag.severity === 'medium' ? 'border-amber-200 bg-amber-50' : ''}>
                        <AlertTriangle className={`h-4 w-4 ${flag.severity === 'medium' ? 'text-amber-600' : ''}`} />
                        <AlertTitle className={`font-semibold ${flag.severity === 'medium' ? 'text-amber-800' : ''}`}>
                          {flag.issue}
                        </AlertTitle>
                        <AlertDescription className={flag.severity === 'medium' ? 'text-amber-700' : ''}>
                          {flag.explanation}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                ) : (
                  <Alert className="bg-emerald-50 border-emerald-200">
                    <HeartPulse className="h-4 w-4 text-emerald-600" />
                    <AlertTitle className="text-emerald-800 font-semibold">Great Job!</AlertTitle>
                    <AlertDescription className="text-emerald-700">
                      We didn't detect any serious overspending issues based on our rules.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Recommendations */}
                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-semibold">Tailored Advice</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {analysis.recommendations && analysis.recommendations.map((rec, idx) => (
                      <Card key={idx} className="shadow-sm border-slate-200">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-md flex items-center">
                            <span className={`w-2 h-2 rounded-full mr-2 ${
                              rec.severity === 'critical' ? 'bg-red-500' :
                              rec.severity === 'high' ? 'bg-orange-500' :
                              rec.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                            }`}></span>
                            {rec.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm font-medium text-slate-800">{rec.action}</p>
                          <p className="text-sm text-slate-500 mt-2 p-2 bg-slate-50 rounded-md border text-slate-600">
                            <strong>Impact:</strong> {rec.impact}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
