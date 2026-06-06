'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Paperclip, Upload, Trash2, Download, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Expense } from '@/types';

const STATUS_BADGE: Record<string, React.ReactNode> = {
  DRAFT:     <Badge variant="muted">Draft</Badge>,
  SUBMITTED: <Badge variant="warning">Submitted</Badge>,
  APPROVED:  <Badge variant="success">Approved</Badge>,
  REJECTED:  <Badge variant="destructive">Rejected</Badge>,
};

export default function ExpenseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.get(`/expenses/${id}`)
      .then((r) => setExpense(r.data.data))
      .catch(() => router.push('/expenses'));
  }, [id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    try {
      const r = await api.post(`/expenses/${id}/attachments`, form);
      setExpense((prev) => prev ? { ...prev, attachments: [...prev.attachments, r.data.data] } : prev);
    } catch (err: any) {
      alert(err.response?.data?.error?.message ?? 'Upload failed');
    } finally { setUploading(false); e.target.value = ''; }
  };

  const deleteAttachment = async (attId: string) => {
    if (!confirm('Remove this attachment?')) return;
    await api.delete(`/expenses/${id}/attachments/${attId}`);
    setExpense((prev) => prev ? { ...prev, attachments: prev.attachments.filter((a) => a.id !== attId) } : prev);
  };

  if (!expense) return (
    <div className="flex items-center justify-center h-64 text-slate-400 text-sm">Loading...</div>
  );

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{expense.title}</h1>
          <p className="text-slate-500 text-sm">Expense details</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-3xl font-bold text-slate-900 tabular-nums">
                {formatCurrency(Number(expense.amount), expense.currency)}
              </p>
              <p className="text-slate-500 text-sm mt-1">{formatDate(expense.expenseDate)}</p>
            </div>
            {STATUS_BADGE[expense.status]}
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-5">
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div>
              <dt className="text-slate-400 mb-0.5">Category</dt>
              <dd className="font-medium">{expense.category.replace('_', ' ')}</dd>
            </div>
            <div>
              <dt className="text-slate-400 mb-0.5">Currency</dt>
              <dd className="font-medium">{expense.currency}</dd>
            </div>
            <div>
              <dt className="text-slate-400 mb-0.5">Period</dt>
              <dd className="font-medium">{expense.month}/{expense.year}</dd>
            </div>
            <div>
              <dt className="text-slate-400 mb-0.5">Created</dt>
              <dd className="font-medium">{formatDate(expense.createdAt)}</dd>
            </div>
            {expense.description && (
              <div className="col-span-2">
                <dt className="text-slate-400 mb-0.5">Description</dt>
                <dd className="font-medium leading-relaxed">{expense.description}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Attachments */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Receipts & Attachments
              <span className="text-slate-400 font-normal text-sm">({expense.attachments.length})</span>
            </CardTitle>
            {expense.status === 'DRAFT' && (
              <label className="cursor-pointer">
                <Button variant="outline" size="sm" asChild>
                  <span>
                    {uploading ? 'Uploading...' : <><Upload className="h-3.5 w-3.5" />Attach file</>}
                  </span>
                </Button>
                <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleUpload} className="hidden" disabled={uploading} />
              </label>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {expense.attachments.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-20" />
              No attachments yet
            </div>
          ) : (
            <div className="space-y-2">
              {expense.attachments.map((att) => (
                <div key={att.id} className="flex items-center justify-between p-3 rounded-lg border bg-slate-50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded bg-slate-200 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{att.filename}</p>
                      <p className="text-xs text-slate-400">{(att.sizeBytes / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-3">
                    <Button variant="ghost" size="icon" title="Download" asChild>
                      <a href={`${process.env.NEXT_PUBLIC_API_URL}/expenses/${id}/attachments/${att.id}`} target="_blank">
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                    {expense.status === 'DRAFT' && (
                      <Button variant="ghost" size="icon" title="Remove"
                        onClick={() => deleteAttachment(att.id)}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {expense.status === 'DRAFT' && (
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <a href={`/expenses/${expense.id}/edit`}>Edit expense</a>
          </Button>
        </div>
      )}
    </div>
  );
}
