'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Send, FileText, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatMonth, formatDate } from '@/lib/utils';
import type { ReimbursementRequest } from '@/types';

const STATUS_BADGE: Record<string, React.ReactNode> = {
  PENDING:   <Badge variant="warning">Pending</Badge>,
  APPROVED:  <Badge variant="success">Approved</Badge>,
  REJECTED:  <Badge variant="destructive">Rejected</Badge>,
  CANCELLED: <Badge variant="secondary">Cancelled</Badge>,
};

export default function ReimbursementsPage() {
  const [requests, setRequests] = useState<ReimbursementRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reimbursements', { params: { limit: 50 } })
      .then((r) => setRequests(r.data.data.requests))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reimbursement Requests</h1>
          <p className="text-slate-500 mt-1">Track your submitted reimbursement requests</p>
        </div>
        <Button asChild>
          <Link href="/reimbursements/new"><Send className="h-4 w-4" />Submit Request</Link>
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm">Loading...</div>
          ) : requests.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium text-slate-500">No requests yet</p>
              <p className="text-sm mt-1">Submit your first reimbursement request</p>
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <Link href="/reimbursements/new">Submit request</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Expenses</TableHead>
                  <TableHead>Total (USD)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{formatMonth(r.month, r.year)}</TableCell>
                    <TableCell>
                      <span className="text-xs bg-slate-100 text-slate-600 rounded px-2 py-0.5">
                        {r.items.length} item{r.items.length !== 1 ? 's' : ''}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold tabular-nums">
                      {formatCurrency(Number(r.totalAmountUSD), 'USD')}
                    </TableCell>
                    <TableCell>{STATUS_BADGE[r.status]}</TableCell>
                    <TableCell className="text-slate-500 text-sm">{formatDate(r.submittedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/reimbursements/${r.id}`}>View <ArrowRight className="h-3 w-3" /></Link>
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
