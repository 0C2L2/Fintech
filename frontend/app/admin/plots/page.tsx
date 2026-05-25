"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { DashboardLayout } from "@/components/DashboardLayout";
import { RPlot } from "@/components/RPlot";
import { Card } from "@/components/ui/card";
import {
  Brain, ShieldAlert, Target, TrendingUp, Layers, Activity, FlaskConical
} from "lucide-react";

interface PlotSection {
  id: string;
  endpoint: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  sourceFile: string;
  sourceFunction: string;
  explanation: string;
  bullets: string[];
  color: string;
}

const PLOT_SECTIONS: PlotSection[] = [
  {
    id: "feature-vector",
    endpoint: "feature-vector",
    icon: <Layers className="h-5 w-5" />,
    title: "Feature Engineering — build_feature_vector()",
    subtitle: "features.R",
    sourceFile: "features.R",
    sourceFunction: "build_feature_vector(user_id, month)",
    explanation:
      "Before any ML algorithm can run, the raw expense data is distilled into a compact numeric vector. This plot shows the 8 core features and which algorithms consume each one.",
    bullets: [
      "Savings Rate = (income − total_expense) / income — the single most influential feature",
      "Category Shares = each category's amount ÷ total expenses (rent_share, food_share, etc.)",
      "Expense Growth = (this month − last month) / last month — detects sudden spending spikes",
      "Avg Savings (3m) = rolling mean of actual surplus over the past 3 months — used only by prediction",
      "All shares are safe-divided (return 0 if denominator is 0) to prevent NaN propagation",
    ],
    color: "blue",
  },
  {
    id: "segmentation",
    endpoint: "segmentation",
    icon: <Brain className="h-5 w-5" />,
    title: "User Segmentation — assign_cluster()",
    subtitle: "clustering.R",
    sourceFile: "clustering.R",
    sourceFunction: "assign_cluster(features)",
    explanation:
      "Each user-month is assigned to one of 4 financial segments. The bar chart shows the real distribution across all users currently in the database.",
    bullets: [
      "Primary: K-Means model (kmeans_model.rds) trained offline — finds the nearest cluster centroid using Euclidean distance on scaled features",
      "Fallback: Rule-based segmentation runs when no model file exists (priority: High Saver → Rent-Burdened → Entertainment-Heavy → Balanced Budgeter)",
      "High Saver: savings_rate > 25%",
      "Rent-Burdened User: rent > 40% of total expenses",
      "Entertainment-Heavy Spender: entertainment > 20% of total expenses",
      "Balanced Budgeter: default when no other rule fires",
    ],
    color: "purple",
  },
  {
    id: "overspending-rules",
    endpoint: "overspending-rules",
    icon: <ShieldAlert className="h-5 w-5" />,
    title: "Overspending Detection — Category Thresholds",
    subtitle: "rules.R + overspending.R",
    sourceFile: "rules.R",
    sourceFunction: "detect_overspending(features)",
    explanation:
      "The FINANCIAL_RULES list in rules.R defines the maximum safe share (as % of total spending) for each category. If a user exceeds any threshold, a flag is raised with a severity level.",
    bullets: [
      "Rent ≤ 40%: Exceeding this is High severity — housing costs dominate the budget",
      "Food ≤ 30%: Exceeding is Medium severity — signals lack of meal planning or high dining-out",
      "Transport ≤ 25%: Exceeding is Low severity — flagged but considered partially unavoidable",
      "Entertainment ≤ 20%: Exceeding is Medium severity — most discretionary category",
      "Discretionary ≤ 40%: Total non-essential (entertainment + dining + other) combined",
      "Two additional rules not shown here: Spending exceeds income (Critical) and Expense growth > 20% (Medium)",
    ],
    color: "red",
  },
  {
    id: "overspending-frequency",
    endpoint: "overspending-frequency",
    icon: <Activity className="h-5 w-5" />,
    title: "Live Overspending Issue Frequency",
    subtitle: "overspending.R — live from analysis_results table",
    sourceFile: "overspending.R",
    sourceFunction: "detect_overspending() — aggregated across last 200 analyses",
    explanation:
      "Every time a user runs 'Analyze', the system stores the detected overspending flags as JSON in the analysis_results table. This plot aggregates those flags to show which issues are most common platform-wide.",
    bullets: [
      "Bars are colored by severity: Red = Critical, Orange = High, Yellow = Medium, Green = Low",
      "Data from the last 200 analysis runs to show recent platform-wide trends",
      "High rent burden is often the most common flag in urban user populations",
      "Low savings rate and Spending exceeds income are the most actionable flags for users",
      "The presence of 'Budget exceeded: X' flags means users have set custom per-category thresholds",
    ],
    color: "orange",
  },
  {
    id: "score-formula",
    endpoint: "score-formula",
    icon: <Target className="h-5 w-5" />,
    title: "Financial Score — calculate_financial_score()",
    subtitle: "overspending.R",
    sourceFile: "overspending.R",
    sourceFunction: "calculate_financial_score(features, flags)",
    explanation:
      "The financial score is a 0–100 integer computed after all overspending flags are detected. It starts at 100, deducts points per flag severity, and adds bonuses for strong savings rates.",
    bullets: [
      "Starts at 100 (perfect health assumed, then penalties applied)",
      "Critical flag (e.g., spending > income): −25 points — most severe deduction",
      "High flag (e.g., low savings rate, high rent): −15 points each",
      "Medium flag (e.g., high entertainment, high food): −10 points each",
      "Low flag (e.g., high transport): −5 points",
      "+10 bonus if savings_rate > 20%, additional +5 if > 30%",
      "Score is clamped: max(0, min(100, score)) — can never go negative",
    ],
    color: "amber",
  },
  {
    id: "score-distribution",
    endpoint: "score-distribution",
    icon: <Target className="h-5 w-5" />,
    title: "Financial Score Distribution — Across All Users",
    subtitle: "Live from analysis_results table",
    sourceFile: "overspending.R",
    sourceFunction: "financial_score column in analysis_results",
    explanation:
      "Shows how scores are distributed across all analysis results in the database. Helps identify what fraction of the user base is financially healthy vs. struggling.",
    bullets: [
      "Green band (80–100): Excellent — no or minor flags, typically High Savers or Balanced Budgeters",
      "Amber band (50–79): Moderate — some flags detected, needs improvement",
      "Red band (0–49): Needs attention — multiple high/critical flags, urgent advice is generated",
      "Dashed vertical lines mark the band thresholds at scores 50 and 80",
      "A score of 0 means 4+ critical/high flags were detected simultaneously",
    ],
    color: "green",
  },
  {
    id: "savings-prediction",
    endpoint: "savings-prediction",
    icon: <TrendingUp className="h-5 w-5" />,
    title: "Savings Prediction — predict_savings() + simple_predict_savings()",
    subtitle: "prediction.R",
    sourceFile: "prediction.R",
    sourceFunction: "predict_savings(features, user_id)",
    explanation:
      "The system predicts how much a user will save next month. The chart shows the aggregate trend across all users with the linear regression forecast for the next period.",
    bullets: [
      "Primary model: Random Forest (rf_savings_model.rds) — uses 10 features including all category shares, income, expense growth, and rolling average savings",
      "Fallback: lm(savings ~ t) — simple linear regression on a time index over the last 6 months",
      "Last-resort fallback (< 2 months history): income − total_expense",
      "Predicted value appears in the Analysis page, Excel report Summary sheet, and triggers a critical recommendation if negative",
      "Green bars = avg income, Red bars = avg expenses, Blue line = actual savings, Diamond = predicted",
    ],
    color: "emerald",
  },
];

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  blue:    { bg: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-700",    badge: "bg-blue-100 text-blue-700" },
  purple:  { bg: "bg-purple-50",  border: "border-purple-200",  text: "text-purple-700",  badge: "bg-purple-100 text-purple-700" },
  red:     { bg: "bg-red-50",     border: "border-red-200",     text: "text-red-700",     badge: "bg-red-100 text-red-700" },
  orange:  { bg: "bg-orange-50",  border: "border-orange-200",  text: "text-orange-700",  badge: "bg-orange-100 text-orange-700" },
  amber:   { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-700",   badge: "bg-amber-100 text-amber-700" },
  green:   { bg: "bg-green-50",   border: "border-green-200",   text: "text-green-700",   badge: "bg-green-100 text-green-700" },
  emerald: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700" },
};

export default function AdminPlotsPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== "admin") router.push("/dashboard");
  }, [user, router]);

  if (!user || user.role !== "admin") return null;

  return (
    <DashboardLayout>
      <div className="space-y-12 pb-16">

        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
            <FlaskConical className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">R Algorithm Plots</h1>
            <p className="text-slate-500 mt-1">
              Every chart is generated live by the R backend using <strong>ggplot2</strong>.
              Each section explains the corresponding function, its inputs, logic, and outputs.
            </p>
          </div>
        </div>

        {/* Plot sections */}
        {PLOT_SECTIONS.map((section, idx) => {
          const c = COLOR_MAP[section.color] ?? COLOR_MAP.blue;
          return (
            <section key={section.id} id={section.id}>
              {/* Section header */}
              <div className="flex items-start gap-3 mb-5">
                <div className={`w-9 h-9 rounded-lg ${c.bg} ${c.text} flex items-center justify-center shrink-0`}>
                  {section.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-xl font-bold text-slate-900">{section.title}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-semibold ${c.badge}`}>
                      {section.sourceFile}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Plot {idx + 1} / {PLOT_SECTIONS.length}</span>
                  </div>
                  <p className="text-slate-500 text-sm mt-1">{section.explanation}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
                {/* The R plot image — takes 3/5 of the width */}
                <div className="xl:col-span-3">
                  <RPlot
                    endpoint={section.endpoint}
                    alt={section.title}
                    className="w-full"
                  />
                </div>

                {/* Explanation card — takes 2/5 */}
                <Card className={`xl:col-span-2 p-5 ${c.bg} border ${c.border} flex flex-col gap-4`}>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Source function</p>
                    <code className={`text-sm font-mono ${c.text} bg-white px-3 py-1.5 rounded-lg border ${c.border} block break-all`}>
                      {section.sourceFunction}
                    </code>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">How it works</p>
                    <ul className="space-y-2.5">
                      {section.bullets.map((b, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                          <span className={`w-5 h-5 rounded-full ${c.badge} flex items-center justify-center text-xs font-bold shrink-0 mt-0.5`}>
                            {i + 1}
                          </span>
                          <span className="leading-snug">{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              </div>

              {/* Divider between sections */}
              {idx < PLOT_SECTIONS.length - 1 && (
                <div className="mt-12 border-t border-slate-100" />
              )}
            </section>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
