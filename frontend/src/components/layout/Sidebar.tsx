'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Receipt, PlusCircle, FileText, Send,
  LogOut, Building2, ShieldCheck, Users, TrendingUp,
} from 'lucide-react';
import { removeToken, getCurrentUser } from '@/lib/auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const EMPLOYEE_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: '/expenses', label: 'My Expenses', icon: <Receipt className="h-4 w-4" /> },
  { href: '/expenses/new', label: 'New Expense', icon: <PlusCircle className="h-4 w-4" /> },
  { href: '/reimbursements', label: 'Requests', icon: <FileText className="h-4 w-4" /> },
  { href: '/reimbursements/new', label: 'Submit Request', icon: <Send className="h-4 w-4" /> },
];

const EMPLOYER_NAV: NavItem[] = [
  { href: '/employer/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: '/employer/requests', label: 'Pending Requests', icon: <ShieldCheck className="h-4 w-4" /> },
  { href: '/employer/budget', label: 'Budget Overview', icon: <TrendingUp className="h-4 w-4" /> },
];

export default function Sidebar({ role }: { role: 'employee' | 'employer' }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = getCurrentUser();
  const nav = role === 'employer' ? EMPLOYER_NAV : EMPLOYEE_NAV;

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'U';

  const handleLogout = () => {
    removeToken();
    router.push('/login');
  };

  return (
    <aside className="flex h-screen w-60 flex-col bg-slate-900 text-slate-300 shrink-0 sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <Building2 className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">ExpenseApp</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">
            {role === 'employer' ? 'Employer Portal' : 'Employee Portal'}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <p className="px-3 mb-2 text-[10px] uppercase tracking-widest text-slate-600 font-semibold">
          Navigation
        </p>
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100',
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-slate-800 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-blue-600 text-white text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate">{user?.email}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">{user?.role} · {user?.currency}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="text-slate-600 hover:text-red-400 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
