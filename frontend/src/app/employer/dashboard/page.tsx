'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, CheckCircle, XCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate, formatMonth } from '@/lib/utils';
import type { ReimbursementRequest } from '@/types';

export default function EmployerDashboard() {
  const user = getCurrentUser();
  const [pending, setPending] = useState<ReimbursementRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reimbursements/pending', { params: { limit: 10 } })
      .then((r) => setPending(r.data.data.requests))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Employer Dashboard</h1>
          <p className="text-slate-500 mt-1">Review and approve reimbursement requests · Currency: {user?.currency}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/employer/budget"><TrendingUp className="h-4 w-4" />Budget Overview</Link>
          </Button>
          <Button asChild>
            <Link href="/employer/requests"><Clock className="h-4 w-4" />Review Requests</Link>
          </Button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 mb-3">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-3xl font-bold">{loading ? '—' : pending.length}</p>
            <p className="text-sm font-medium text-slate-600 mt-0.5">Awaiting Review</p>
            <p className="text-xs text-slate-400 mt-0.5">pending requests</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 mb-3">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-sm font-semibold text-slate-600 mt-5">Pending value</p>
            <p className="text-lg font-bold text-blue-700 tabular-nums">
              {loading ? '—' : formatCurrency(
                pending.reduce((sum, r) => sum + Number(r.totalAmountUSD), 0), 'USD',
              )}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 mb-3">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-sm font-semibold text-slate-600 mt-5">Your currency</p>
            <p className="text-lg font-bold text-slate-700">{user?.currency ?? 'USD'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending requests table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4 flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Pending Requests</CardTitle>
            <CardDescription>Requires your review and action</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/employer/requests">View all <ArrowRight className="h-3 w-3" /></Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Loading...</div>
          ) : pending.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-20 text-emerald-500" />
              <p className="text-sm font-medium text-slate-500">All caught up!</p>
              <p className="text-sm mt-0.5">No pending requests to review</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Amount ({user?.currency})</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.employee.name}</TableCell>
                    <TableCell>{formatMonth(r.month, r.year)}</TableCell>
                    <TableCell><Badge variant="muted">{r.items.length}</Badge></TableCell>
                    <TableCell className="font-semibold tabular-nums text-blue-700">
                      {formatCurrency(Number(r.totalInViewerCurrency ?? r.totalAmountUSD), user?.currency ?? 'USD')}
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">{formatDate(r.submittedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" asChild>
                        <Link href={`/employer/requests/${r.id}`}>Review</Link>
                      </Button>
                    </TableCell>
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
