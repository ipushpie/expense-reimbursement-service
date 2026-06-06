'use client';
import { useEffect, useState } from 'react';
import { TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import type { Department } from '@/types';

interface BudgetData {
  department: { id: string; name: string };
  budget: { amount: number; currency: string; amountUSD: number; inEmployerCurrency: number; employerCurrency: string };
  approved: { amountUSD: number; inEmployerCurrency: number; employerCurrency: string };
  remaining: { amountUSD: number; inEmployerCurrency: number };
  overBudget: boolean;
}

export default function BudgetPage() {
  const user = getCurrentUser();
  const now = new Date();
  const [depts, setDepts] = useState<Department[]>([]);
  const [budgets, setBudgets] = useState<BudgetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));

  useEffect(() => {
    api.get('/departments').then((r) => setDepts(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (depts.length === 0) return;
    setLoading(true);
    Promise.all(
      depts.map((d) => api.get(`/departments/${d.id}/budget`, { params: { month, year } }).then((r) => r.data.data)),
    ).then((data) => { setBudgets(data); setLoading(false); }).catch(() => setLoading(false));
  }, [depts, month, year]);

  const totalBudgetUSD = budgets.reduce((sum, b) => sum + b.budget.amountUSD, 0);
  const totalApprovedUSD = budgets.reduce((sum, b) => sum + b.approved.amountUSD, 0);
  const overBudgetDepts = budgets.filter((b) => b.overBudget).length;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Budget Overview</h1>
          <p className="text-slate-500 mt-1">Monitor departmental spend against monthly budgets</p>
        </div>
        <div className="flex gap-3">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>
                  {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2023, 2024, 2025, 2026].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary KPIs */}
      {!loading && budgets.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-5">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 mb-3">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-2xl font-bold tabular-nums">{formatCurrency(totalBudgetUSD, 'USD')}</p>
              <p className="text-sm text-slate-500 mt-0.5">Total monthly budget</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-5">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 mb-3">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold tabular-nums">{formatCurrency(totalApprovedUSD, 'USD')}</p>
              <p className="text-sm text-slate-500 mt-0.5">Total approved spend</p>
            </CardContent>
          </Card>
          <Card className={`border-0 shadow-sm ${overBudgetDepts > 0 ? 'ring-1 ring-red-200' : ''}`}>
            <CardContent className="pt-5">
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl mb-3 ${overBudgetDepts > 0 ? 'bg-red-50' : 'bg-slate-50'}`}>
                <AlertTriangle className={`h-5 w-5 ${overBudgetDepts > 0 ? 'text-red-500' : 'text-slate-400'}`} />
              </div>
              <p className={`text-2xl font-bold ${overBudgetDepts > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                {overBudgetDepts}
              </p>
              <p className="text-sm text-slate-500 mt-0.5">Departments over budget</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Per-department cards */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">Loading budget data...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b) => {
            const pct = Math.min(100, (b.approved.amountUSD / b.budget.amountUSD) * 100);
            return (
              <Card key={b.department.id} className={`border-0 shadow-sm ${b.overBudget ? 'ring-1 ring-red-200' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{b.department.name}</CardTitle>
                    {b.overBudget
                      ? <Badge variant="destructive" className="text-xs"><AlertTriangle className="h-3 w-3 mr-1" />Over Budget</Badge>
                      : pct > 80
                      ? <Badge variant="warning" className="text-xs">High Usage</Badge>
                      : <Badge variant="success" className="text-xs">On Track</Badge>
                    }
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Utilisation</span>
                      <span className={`font-semibold ${b.overBudget ? 'text-red-600' : pct > 80 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={pct} className={b.overBudget ? '[&>div]:bg-red-500' : pct > 80 ? '[&>div]:bg-amber-500' : ''} />
                  </div>
                  <Separator />
                  <dl className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <dt className="text-slate-400 text-xs mb-0.5">Budget</dt>
                      <dd className="font-semibold tabular-nums text-xs">
                        {formatCurrency(b.budget.inEmployerCurrency, b.budget.employerCurrency)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400 text-xs mb-0.5">Approved</dt>
                      <dd className={`font-semibold tabular-nums text-xs ${b.overBudget ? 'text-red-600' : 'text-blue-700'}`}>
                        {formatCurrency(b.approved.inEmployerCurrency, b.approved.employerCurrency)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400 text-xs mb-0.5">Remaining</dt>
                      <dd className={`font-semibold tabular-nums text-xs ${b.overBudget ? 'text-red-500' : 'text-emerald-600'}`}>
                        {b.overBudget ? '—' : formatCurrency(b.remaining.inEmployerCurrency, b.budget.employerCurrency)}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
