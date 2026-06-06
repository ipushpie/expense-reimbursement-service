'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { ArrowLeft, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate, formatMonth } from '@/lib/utils';
import type { ReimbursementRequest } from '@/types';

const STATUS_BADGE: Record<string, React.ReactNode> = {
  PENDING:   <Badge variant="warning">Pending</Badge>,
  APPROVED:  <Badge variant="success">Approved</Badge>,
  REJECTED:  <Badge variant="destructive">Rejected</Badge>,
};

export default function ReviewRequestPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = getCurrentUser();
  const [req, setReq] = useState<ReimbursementRequest | null>(null);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [error, setError] = useState('');
  const [approving, setApproving] = useState(false);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<{ rejectionReason: string }>();

  useEffect(() => {
    api.get(`/reimbursements/${id}`)
      .then((r) => setReq(r.data.data))
      .catch(() => router.push('/employer/requests'));
  }, [id]);

  const approve = async () => {
    setError('');
    setApproving(true);
    try {
      await api.patch(`/reimbursements/${id}/approve`);
      router.push('/employer/requests');
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'Approval failed');
      setApproving(false);
    }
  };

  const reject = async (data: { rejectionReason: string }) => {
    setError('');
    try {
      await api.patch(`/reimbursements/${id}/reject`, data);
      router.push('/employer/requests');
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'Rejection failed');
    }
  };

  if (!req) return <div className="flex items-center justify-center h-64 text-slate-400 text-sm">Loading...</div>;

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Review Request</h1>
          <p className="text-slate-500 text-sm">{req.employee.name} · {formatMonth(req.month, req.year)}</p>
        </div>
        <div className="ml-auto">{STATUS_BADGE[req.status] ?? <Badge variant="secondary">{req.status}</Badge>}</div>
      </div>

      {/* Summary */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Total (USD)</p>
              <p className="text-3xl font-bold text-slate-900 tabular-nums">
                {formatCurrency(Number(req.totalAmountUSD), 'USD')}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">In Your Currency ({user?.currency})</p>
              <p className="text-3xl font-bold text-blue-700 tabular-nums">
                {formatCurrency(Number(req.totalInViewerCurrency ?? req.totalAmountUSD), user?.currency ?? 'USD')}
              </p>
            </div>
          </div>
          {req.notes && (
            <div className="mt-4 p-3 rounded-lg bg-slate-50 text-sm text-slate-600">
              <span className="font-medium">Employee note: </span>{req.notes}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expense breakdown */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Expense Breakdown ({req.items.length} items)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Expense</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
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
                  <TableCell className="text-slate-500 text-sm">{formatDate(item.expense.expenseDate)}</TableCell>
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

      {/* Rejection reason (if rejected) */}
      {req.status === 'REJECTED' && req.rejectionReason && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Rejected</AlertTitle>
          <AlertDescription>{req.rejectionReason}</AlertDescription>
        </Alert>
      )}

      {/* Action panel */}
      {req.status === 'PENDING' && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Decision</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!action && (
              <div className="flex gap-3">
                <Button variant="success" onClick={approve} disabled={approving} className="flex-1">
                  {approving ? <><Loader2 className="h-4 w-4 animate-spin" />Approving...</> : <><CheckCircle className="h-4 w-4" />Approve</>}
                </Button>
                <Button variant="destructive" onClick={() => setAction('reject')} className="flex-1">
                  <XCircle className="h-4 w-4" />Reject
                </Button>
              </div>
            )}

            {action === 'reject' && (
              <form onSubmit={handleSubmit(reject)} className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Rejection Reason *</Label>
                  <Textarea
                    {...register('rejectionReason', { required: true, minLength: 5 })}
                    placeholder="Explain why this request is being rejected..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" variant="destructive" disabled={isSubmitting}>
                    {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" />Rejecting...</> : 'Confirm Rejection'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setAction(null)}>Cancel</Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
