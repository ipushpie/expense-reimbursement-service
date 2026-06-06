'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Receipt, PlusCircle, Send, CheckCircle, Clock, FileText, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Expense } from '@/types';

const STATUS_BADGE: Record<string, React.ReactNode> = {
  DRAFT:     <Badge variant="muted">Draft</Badge>,
  SUBMITTED: <Badge variant="warning">Submitted</Badge>,
  APPROVED:  <Badge variant="success">Approved</Badge>,
  REJECTED:  <Badge variant="destructive">Rejected</Badge>,
};

export default function EmployeeDashboard() {
  const user = getCurrentUser();
  const now = new Date();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/expenses', { params: { month: now.getMonth() + 1, year: now.getFullYear(), limit: 100 } })
      .then((r) => setExpenses(r.data.data.expenses))
      .finally(() => setLoading(false));
  }, []);

  const draft = expenses.filter((e) => e.status === 'DRAFT');
  const submitted = expenses.filter((e) => e.status === 'SUBMITTED');
  const approved = expenses.filter((e) => e.status === 'APPROVED');
  const totalApproved = approved.reduce((sum, e) => sum + Number(e.amount), 0);

  const kpis = [
    { label: 'This Month', value: expenses.length, sub: 'total expenses', icon: <Receipt className="h-5 w-5 text-blue-500" />, bg: 'bg-blue-50' },
    { label: 'Draft', value: draft.length, sub: 'awaiting submission', icon: <FileText className="h-5 w-5 text-slate-500" />, bg: 'bg-slate-50' },
    { label: 'Pending Review', value: submitted.length, sub: 'submitted to employer', icon: <Clock className="h-5 w-5 text-amber-500" />, bg: 'bg-amber-50' },
    { label: 'Approved', value: approved.length, sub: 'expenses approved', icon: <CheckCircle className="h-5 w-5 text-emerald-500" />, bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Good {now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening'} 👋
          </h1>
          <p className="text-slate-500 mt-1">
            {now.toLocaleString('default', { month: 'long', year: 'numeric' })} · {user?.currency} account
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/reimbursements/new"><Send className="h-4 w-4" />Submit Request</Link>
          </Button>
          <Button asChild>
            <Link href="/expenses/new"><PlusCircle className="h-4 w-4" />New Expense</Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-0 shadow-sm">
            <CardContent className="pt-5">
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${kpi.bg} mb-3`}>
                {kpi.icon}
              </div>
              <p className="text-3xl font-bold text-slate-900">{kpi.value}</p>
              <p className="text-sm font-medium text-slate-600 mt-0.5">{kpi.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Approved total highlight */}
      {approved.length > 0 && (
        <Card className="border-0 bg-emerald-50 shadow-sm">
          <CardContent className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-900">Approved for reimbursement this month</p>
                <p className="text-xs text-emerald-600">{approved.length} expense{approved.length !== 1 ? 's' : ''} approved</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-emerald-700">
              {formatCurrency(totalApproved, expenses[0]?.currency ?? 'USD')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recent expenses table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4 flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Recent Expenses</CardTitle>
            <CardDescription>Latest 5 expenses this month</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/expenses">View all <ArrowRight className="h-3 w-3" /></Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Loading...</div>
          ) : expenses.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Receipt className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No expenses this month</p>
              <Button size="sm" variant="outline" className="mt-3" asChild>
                <Link href="/expenses/new">Add your first expense</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.slice(0, 5).map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">
                      <Link href={`/expenses/${e.id}`} className="hover:text-blue-600 transition-colors">
                        {e.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">{e.category.replace('_', ' ')}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(Number(e.amount), e.currency)}</TableCell>
                    <TableCell className="text-slate-500 text-sm">{formatDate(e.expenseDate)}</TableCell>
                    <TableCell>{STATUS_BADGE[e.status]}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
