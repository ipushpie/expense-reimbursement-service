'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import type { Expense } from '@/types';

export default function SubmitReimbursementPage() {
  const router = useRouter();
  const now = new Date();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [budgetWarning, setBudgetWarning] = useState(false);
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({ defaultValues: { notes: '' } });

  useEffect(() => {
    api.get('/expenses', { params: { month, year, status: 'DRAFT', limit: 100 } })
      .then((r) => setExpenses(r.data.data.expenses))
      .catch(() => {});
    setSelected([]);
  }, [month, year]);

  const toggle = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const selectAll = () => setSelected(expenses.map((e) => e.id));
  const clearAll = () => setSelected([]);

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
      router.push('/reimbursements');
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'Submission failed');
    }
  };

  if (budgetWarning) return (
    <div className="max-w-lg animate-fade-in">
      <Alert variant="warning" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Budget Warning</AlertTitle>
        <AlertDescription>
          This submission exceeds your department's monthly budget. Your request has been submitted and is pending employer review.
        </AlertDescription>
      </Alert>
      <Button onClick={() => router.push('/reimbursements')}>
        <CheckCircle2 className="h-4 w-4" />View My Requests
      </Button>
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Submit Reimbursement Request</h1>
        <p className="text-slate-500 mt-1">Select draft expenses to include in your reimbursement request</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Select Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
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
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Select Expenses</CardTitle>
                <CardDescription>Only DRAFT expenses are shown</CardDescription>
              </div>
              {expenses.length > 0 && (
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={selectAll}>Select all</Button>
                  {selected.length > 0 && <Button type="button" variant="ghost" size="sm" onClick={clearAll}>Clear</Button>}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {expenses.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm">
                No draft expenses for this period
              </div>
            ) : (
              <div className="divide-y">
                {expenses.map((e) => (
                  <label key={e.id} className={`flex items-center gap-4 px-6 py-3.5 cursor-pointer transition-colors ${selected.includes(e.id) ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                    <input type="checkbox" checked={selected.includes(e.id)} onChange={() => toggle(e.id)}
                      className="h-4 w-4 rounded accent-blue-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{e.title}</p>
                      <p className="text-xs text-slate-400">{e.category.replace('_', ' ')}</p>
                    </div>
                    <p className="font-semibold text-sm tabular-nums">{formatCurrency(Number(e.amount), e.currency)}</p>
                  </label>
                ))}
              </div>
            )}
          </CardContent>
          {selected.length > 0 && (
            <>
              <Separator />
              <div className="px-6 py-3 flex items-center justify-between bg-slate-50">
                <p className="text-sm text-slate-500">{selected.length} expense{selected.length !== 1 ? 's' : ''} selected</p>
                <p className="font-bold text-blue-700 text-sm">
                  ≈ {formatCurrency(selectedTotal, selectedCurrency)} total
                </p>
              </div>
            </>
          )}
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Notes <span className="text-slate-400 font-normal text-sm">(optional)</span></CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea {...register('notes')} placeholder="Any notes for the approver..." rows={3} />
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={isSubmitting || selected.length === 0} size="lg">
          {isSubmitting
            ? <><Loader2 className="h-4 w-4 animate-spin" />Submitting...</>
            : `Submit ${selected.length > 0 ? `${selected.length} expense${selected.length !== 1 ? 's' : ''}` : 'request'}`
          }
        </Button>
      </form>
    </div>
  );
}
