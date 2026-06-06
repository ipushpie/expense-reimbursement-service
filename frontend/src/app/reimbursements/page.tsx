'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Send, FileText, ArrowRight, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody } from '@/components/ui/sheet';
import { formatCurrency, formatMonth, formatDate } from '@/lib/utils';
import type { ReimbursementRequest, Expense } from '@/types';

const STATUS_BADGE: Record<string, React.ReactNode> = {
  PENDING:   <Badge variant="warning">Pending</Badge>,
  APPROVED:  <Badge variant="success">Approved</Badge>,
  REJECTED:  <Badge variant="destructive">Rejected</Badge>,
  CANCELLED: <Badge variant="secondary">Cancelled</Badge>,
};

function SubmitSheet({ open, onClose, onSubmitted }: { open: boolean; onClose: () => void; onSubmitted: () => void }) {
  const now = new Date();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [budgetWarning, setBudgetWarning] = useState(false);
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({ defaultValues: { notes: '' } });

  useEffect(() => {
    if (!open) return;
    api.get('/expenses', { params: { month, year, status: 'DRAFT', limit: 100 } })
      .then((r) => setExpenses(r.data.data.expenses))
      .catch(() => {});
    setSelected([]);
    setBudgetWarning(false);
    setError('');
  }, [open, month, year]);

  const toggle = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const selectedTotal = expenses
    .filter((e) => selected.includes(e.id))
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const selectedCurrency = expenses.find((e) => selected.includes(e.id))?.currency ?? 'USD';

  const onSubmit = async (data: any) => {
    setError('');
    if (selected.length === 0) { setError('Select at least one expense'); return; }
    try {
      const res = await api.post('/reimbursements', {
        expenseIds: selected,
        month: Number(month),
        year: Number(year),
        notes: data.notes || undefined,
      });
      if (res.data.data.budgetWarning) { setBudgetWarning(true); return; }
      reset();
      onSubmitted();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'Submission failed');
    }
  };

  if (budgetWarning) return (
    <div className="space-y-4">
      <Alert variant="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Budget Warning</AlertTitle>
        <AlertDescription>
          This submission exceeds your department's monthly budget. Your request has been submitted and is pending employer review.
        </AlertDescription>
      </Alert>
      <Button onClick={() => { setBudgetWarning(false); onSubmitted(); onClose(); }}>
        <CheckCircle2 className="h-4 w-4" />Done
      </Button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Period picker */}
      <div>
        <p className="text-sm font-medium text-slate-700 mb-2">Billing Period</p>
        <div className="flex gap-2">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
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

      {/* Expense list */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-slate-700">Draft Expenses</p>
          {expenses.length > 0 && (
            <div className="flex gap-2 text-xs">
              <button type="button" onClick={() => setSelected(expenses.map((e) => e.id))}
                className="text-blue-600 hover:underline">All</button>
              {selected.length > 0 && <button type="button" onClick={() => setSelected([])}
                className="text-slate-400 hover:underline">Clear</button>}
            </div>
          )}
        </div>
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          {expenses.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              No draft expenses for this period
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {expenses.map((e) => (
                <label key={e.id}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${selected.includes(e.id) ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                >
                  <input type="checkbox" checked={selected.includes(e.id)} onChange={() => toggle(e.id)}
                    className="h-4 w-4 rounded accent-blue-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{e.title}</p>
                    <p className="text-xs text-slate-400">{e.category.replace('_', ' ')}</p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums shrink-0">
                    {formatCurrency(Number(e.amount), e.currency)}
                  </p>
                </label>
              ))}
            </div>
          )}
        </div>
        {selected.length > 0 && (
          <div className="mt-2 flex items-center justify-between text-sm px-1">
            <p className="text-slate-500">{selected.length} selected</p>
            <p className="font-bold text-blue-700">≈ {formatCurrency(selectedTotal, selectedCurrency)}</p>
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <p className="text-sm font-medium text-slate-700 mb-2">Notes <span className="text-slate-400 font-normal">(optional)</span></p>
        <Textarea {...register('notes')} placeholder="Any notes for the approver..." rows={3} />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Separator />
      <Button type="submit" disabled={isSubmitting || selected.length === 0} className="w-full">
        {isSubmitting
          ? <><Loader2 className="h-4 w-4 animate-spin" />Submitting...</>
          : `Submit ${selected.length > 0 ? `${selected.length} expense${selected.length !== 1 ? 's' : ''}` : 'request'}`}
      </Button>
    </form>
  );
}

export default function ReimbursementsPage() {
  const [requests, setRequests] = useState<ReimbursementRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitOpen, setSubmitOpen] = useState(false);

  const fetchRequests = () => {
    setLoading(true);
    api.get('/reimbursements', { params: { limit: 50 } })
      .then((r) => setRequests(r.data.data.requests))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRequests(); }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Requests</h1>
          <p className="text-slate-500 mt-1">Track your submitted reimbursement requests</p>
        </div>
        <Button onClick={() => setSubmitOpen(true)}>
          <Send className="h-4 w-4" />Submit Request
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
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setSubmitOpen(true)}>
                Submit request
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

      {/* Submit Request Sheet */}
      <Sheet open={submitOpen} onOpenChange={setSubmitOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Submit Reimbursement</SheetTitle>
            <SheetDescription>Select draft expenses to include in your request</SheetDescription>
          </SheetHeader>
          <SheetBody>
            <SubmitSheet open={submitOpen} onClose={() => setSubmitOpen(false)} onSubmitted={fetchRequests} />
          </SheetBody>
        </SheetContent>
      </Sheet>
    </div>
  );
}
