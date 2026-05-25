"use client";

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SpendingPieChartProps {
  data: { category: string; amount: number }[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

export function SpendingPieChart({ data }: SpendingPieChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!data || data.length === 0) {
    return (
      <Card className="shadow-sm border-slate-200 h-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-slate-500">
          No data available for this month.
        </CardContent>
      </Card>
    );
  }

  // Filter out zero amount categories
  const validData = data.filter(item => item.amount > 0);
  
  if (validData.length === 0) {
    return (
      <Card className="shadow-sm border-slate-200 h-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-slate-500">
          No expenses recorded for this month.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-slate-200 h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Category Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        {mounted && (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={validData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="amount"
              nameKey="category"
            >
              {validData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Amount']}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
