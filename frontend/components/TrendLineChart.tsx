"use client";

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlySummary } from '@/types';

interface TrendLineChartProps {
  data: MonthlySummary[];
}

export function TrendLineChart({ data }: TrendLineChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!data || data.length === 0) {
    return (
      <Card className="shadow-sm border-slate-200 h-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Monthly Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-slate-500">
          No historical data available.
        </CardContent>
      </Card>
    );
  }

  // Sort chronologically (oldest to newest)
  const sortedData = [...data].sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

  // Format month for display
  const formattedData = sortedData.map(item => {
    const date = new Date(item.month);
    return {
      ...item,
      displayMonth: date.toLocaleDateString('default', { month: 'short', year: '2-digit' }),
    };
  });

  return (
    <Card className="shadow-sm border-slate-200 h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Monthly Trend</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        {mounted && (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={formattedData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="displayMonth" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              formatter={(value: any) => [`$${Number(value).toFixed(2)}`, '']}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
            <Area 
              type="monotone" 
              dataKey="income" 
              name="Income"
              stroke="#10b981" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorIncome)" 
            />
            <Area 
              type="monotone" 
              dataKey="total_expense" 
              name="Expenses"
              stroke="#ef4444" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorExpense)" 
            />
          </AreaChart>
        </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
