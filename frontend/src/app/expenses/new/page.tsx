import ExpenseForm from '@/components/forms/ExpenseForm';

export default function NewExpensePage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">New Expense</h1>
        <p className="text-slate-500 mt-1">Record a new expense for reimbursement consideration</p>
      </div>
      <ExpenseForm />
    </div>
  );
}
