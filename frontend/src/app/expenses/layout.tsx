import Sidebar from '@/components/layout/Sidebar';

export default function ExpensesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="employee" />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
