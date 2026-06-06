'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Clock, ArrowRight, Filter } from 'lucide-react';
import { api } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate, formatMonth } from '@/lib/utils';
import type { ReimbursementRequest } from '@/types';

export default function PendingRequestsPage() {
  const user = getCurrentUser();
  const [requests, setRequests] = useState<ReimbursementRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reimbursements/pending', { params: { limit: 100 } })
      .then((r) => setRequests(r.data.data.requests))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pending Requests</h1>
          <p className="text-slate-500 mt-1">Review and action reimbursement requests from your team</p>
        </div>
        {!loading && requests.length > 0 && (
          <Badge variant="warning" className="text-sm px-3 py-1">
            <Clock className="h-3.5 w-3.5 mr-1" />{requests.length} pending
          </Badge>
        )}
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm">Loading...</div>
          ) : requests.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <CheckCircle className="h-10 w-10 mx-auto mb-3 opacity-20 text-emerald-500" />
              <p className="font-medium text-slate-500">All caught up!</p>
              <p className="text-sm mt-1">No pending requests to review right now</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Amount ({user?.currency})</TableHead>
                  <TableHead>USD Total</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{r.employee.name}</p>
                        <p className="text-xs text-slate-400">{r.employee.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{formatMonth(r.month, r.year)}</TableCell>
                    <TableCell>
                      <Badge variant="muted">{r.items.length} item{r.items.length !== 1 ? 's' : ''}</Badge>
                    </TableCell>
                    <TableCell className="font-bold tabular-nums text-blue-700">
                      {formatCurrency(Number(r.totalInViewerCurrency ?? r.totalAmountUSD), user?.currency ?? 'USD')}
                    </TableCell>
                    <TableCell className="tabular-nums text-slate-500 text-sm">
                      {formatCurrency(Number(r.totalAmountUSD), 'USD')}
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">{formatDate(r.submittedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" asChild>
                        <Link href={`/employer/requests/${r.id}`}>
                          Review <ArrowRight className="h-3 w-3" />
                        </Link>
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
