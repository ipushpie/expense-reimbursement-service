'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import ExpenseForm from '@/components/forms/ExpenseForm';
import type { Expense } from '@/types';

export default function EditExpensePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [expense, setExpense] = useState<Expense | null>(null);

  useEffect(() => {
    api.get(`/expenses/${id}`)
      .then((r) => {
        const e = r.data.data;
        if (e.status !== 'DRAFT') { router.push(`/expenses/${id}`); return; }
        setExpense(e);
      })
      .catch(() => router.push('/expenses'));
  }, [id]);

  if (!expense) return <div className="flex items-center justify-center h-64 text-slate-400 text-sm">Loading...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Edit Expense</h1>
        <p className="text-slate-500 mt-1">Update expense details. Only draft expenses can be modified.</p>
      </div>
      <ExpenseForm expense={expense} />
    </div>
  );
}
