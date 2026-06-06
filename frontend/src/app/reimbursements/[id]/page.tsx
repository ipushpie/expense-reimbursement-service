'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate, formatMonth } from '@/lib/utils';
import type { ReimbursementRequest } from '@/types';

const STATUS_BADGE: Record<string, React.ReactNode> = {
  PENDING:   <Badge variant="warning">Pending Review</Badge>,
  APPROVED:  <Badge variant="success">Approved</Badge>,
  REJECTED:  <Badge variant="destructive">Rejected</Badge>,
  CANCELLED: <Badge variant="secondary">Cancelled</Badge>,
};

export default function ReimbursementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [req, setReq] = useState<ReimbursementRequest | null>(null);

  useEffect(() => {
    api.get(`/reimbursements/${id}`)
      .then((r) => setReq(r.data.data))
      .catch(() => router.push('/reimbursements'));
  }, [id]);

  if (!req) return <div className="flex items-center justify-center h-64 text-slate-400 text-sm">Loading...</div>;

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reimbursement Request</h1>
          <p className="text-slate-500 text-sm">{formatMonth(req.month, req.year)}</p>
        </div>
        <div className="ml-auto">{STATUS_BADGE[req.status]}</div>
      </div>

      {/* Rejection alert */}
      {req.status === 'REJECTED' && req.rejectionReason && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Request Rejected</AlertTitle>
          <AlertDescription>{req.rejectionReason}</AlertDescription>
        </Alert>
      )}

      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Total (USD)</p>
              <p className="text-3xl font-bold tabular-nums">{formatCurrency(Number(req.totalAmountUSD), 'USD')}</p>
            </div>
            {req.viewerCurrency && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">In Your Currency</p>
                <p className="text-3xl font-bold text-blue-700 tabular-nums">
                  {formatCurrency(Number(req.totalInViewerCurrency), req.viewerCurrency)}
                </p>
              </div>
            )}
          </div>

          {(req.approver || req.processedAt) && (
            <>
              <Separator className="my-4" />
              <dl className="grid grid-cols-2 gap-4 text-sm">
                {req.approver && <div><dt className="text-slate-400 mb-0.5">Reviewed by</dt><dd className="font-medium">{req.approver.name}</dd></div>}
                {req.processedAt && <div><dt className="text-slate-400 mb-0.5">Processed</dt><dd className="font-medium">{formatDate(req.processedAt)}</dd></div>}
              </dl>
            </>
          )}

          {req.notes && (
            <div className="mt-4 p-3 rounded-lg bg-slate-50 text-sm text-slate-600">
              <strong>Notes: </strong>{req.notes}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Included Expenses ({req.items.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Expense</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Original</TableHead>
                <TableHead className="text-right">USD</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {req.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.expense.title}</TableCell>
                  <TableCell>
                    <span className="text-xs bg-slate-100 text-slate-600 rounded px-2 py-0.5">
                      {item.expense.category.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(Number(item.originalAmount), item.originalCurrency)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-slate-500">
                    {formatCurrency(Number(item.amountUSD), 'USD')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
