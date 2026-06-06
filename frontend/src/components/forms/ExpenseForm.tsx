'use client';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import type { Expense } from '@/types';

const CATEGORIES = [
  'TRAVEL', 'MEALS', 'ACCOMMODATION', 'OFFICE_SUPPLIES',
  'SOFTWARE', 'TRAINING', 'MEDICAL', 'COMMUNICATION', 'ENTERTAINMENT', 'OTHER',
];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD', 'SGD', 'CHF', 'CNY'];

interface Props {
  expense?: Expense;
  /** Called after a successful save — use instead of router.push when embedded in a sheet */
  onSuccess?: () => void;
}

export default function ExpenseForm({ expense, onSuccess }: Props) {
  const router = useRouter();
  const user = getCurrentUser();
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, setValue, formState: { isSubmitting, errors } } = useForm({
    defaultValues: expense
      ? { title: expense.title, amount: Number(expense.amount), currency: expense.currency, category: expense.category, description: expense.description ?? '', expenseDate: expense.expenseDate.split('T')[0] }
      : { currency: user?.currency ?? 'USD', expenseDate: new Date().toISOString().split('T')[0] },
  });

  const onSubmit = async (data: any) => {
    setServerError('');
    try {
      if (expense) {
        await api.patch(`/expenses/${expense.id}`, data);
      } else {
        await api.post('/expenses', data);
      }
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/expenses');
      }
    } catch (err: any) {
      setServerError(err.response?.data?.error?.message ?? 'Failed to save expense');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="title">Title *</Label>
        <Input id="title" placeholder="e.g. Taxi to client meeting"
          {...register('title', { required: 'Title is required' })} />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message as string}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Amount *</Label>
          <Input type="number" step="0.01" min="0.01" placeholder="0.00"
            {...register('amount', { required: true, valueAsNumber: true, min: 0.01 })} />
          {errors.amount && <p className="text-xs text-destructive">Valid amount required</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Currency</Label>
          <Select defaultValue={expense?.currency ?? user?.currency ?? 'USD'} onValueChange={(v) => setValue('currency', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Category *</Label>
          <Select defaultValue={expense?.category ?? ''} onValueChange={(v) => setValue('category', v as any)}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.category && <p className="text-xs text-destructive">Category required</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="expenseDate">Expense Date *</Label>
          <Input id="expenseDate" type="date" {...register('expenseDate', { required: true })} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description <span className="text-slate-400 font-normal">(optional)</span></Label>
        <Textarea id="description" placeholder="Any additional context..."
          {...register('description')} rows={3} />
      </div>

      <Separator />

      {serverError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? <><Loader2 className="h-4 w-4 animate-spin" />{expense ? 'Updating...' : 'Creating...'}</>
            : expense ? 'Update Expense' : 'Create Expense'}
        </Button>
        <Button type="button" variant="outline" onClick={() => onSuccess ? onSuccess() : router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
