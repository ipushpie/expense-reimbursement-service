'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Trash2, Pencil, Eye, Receipt } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Expense } from '@/types';

const STATUS_BADGE: Record<string, React.ReactNode> = {
  DRAFT:     <Badge variant="muted">Draft</Badge>,
  SUBMITTED: <Badge variant="warning">Submitted</Badge>,
  APPROVED:  <Badge variant="success">Approved</Badge>,
  REJECTED:  <Badge variant="destructive">Rejected</Badge>,
  CANCELLED: <Badge variant="secondary">Cancelled</Badge>,
};

export default function ExpensesPage() {
  const now = new Date();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/expenses', { params: { month, year, limit: 100 } })
      .then((r) => setExpenses(r.data.data.expenses))
      .finally(() => setLoading(false));
  }, [month, year]);

  const filtered = expenses.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase()),
  );

  const deleteExpense = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    await api.delete(`/expenses/${id}`);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Expenses</h1>
          <p className="text-slate-500 mt-1">Track and manage your expense records</p>
        </div>
        <Button asChild>
          <Link href="/expenses/new"><PlusCircle className="h-4 w-4" />New Expense</Link>
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Input
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56"
            />
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>
                    {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2023, 2024, 2025, 2026].map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!loading && (
              <p className="text-sm text-slate-400 ml-auto">{filtered.length} expense{filtered.length !== 1 ? 's' : ''}</p>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Receipt className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium text-slate-500">No expenses found</p>
              <p className="text-sm mt-1">Try a different period or create a new expense</p>
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <Link href="/expenses/new">Create expense</Link>
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium max-w-[180px] truncate">{e.title}</TableCell>
                    <TableCell>
                      <span className="text-xs bg-slate-100 text-slate-600 rounded px-2 py-0.5">
                        {e.category.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold tabular-nums">
                      {formatCurrency(Number(e.amount), e.currency)}
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">{formatDate(e.expenseDate)}</TableCell>
                    <TableCell>{STATUS_BADGE[e.status]}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild title="View">
                          <Link href={`/expenses/${e.id}`}><Eye className="h-4 w-4" /></Link>
                        </Button>
                        {e.status === 'DRAFT' && (
                          <>
                            <Button variant="ghost" size="icon" asChild title="Edit">
                              <Link href={`/expenses/${e.id}/edit`}><Pencil className="h-4 w-4" /></Link>
                            </Button>
                            <Button variant="ghost" size="icon" title="Delete"
                              onClick={() => deleteExpense(e.id)}
                              className="text-red-400 hover:text-red-600 hover:bg-red-50">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
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
