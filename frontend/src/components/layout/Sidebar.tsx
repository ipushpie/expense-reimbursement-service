'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Receipt, FileText,
  LogOut, ShieldCheck, TrendingUp, ChevronRight,
} from 'lucide-react';
import { removeToken, getCurrentUser } from '@/lib/auth';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

const EMPLOYEE_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/expenses', label: 'My Expenses', icon: Receipt },
  { href: '/reimbursements', label: 'My Requests', icon: FileText },
];

const EMPLOYER_NAV: NavItem[] = [
  { href: '/employer/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/employer/requests', label: 'Approval Queue', icon: ShieldCheck },
  { href: '/employer/budget', label: 'Budget Overview', icon: TrendingUp },
];

export default function Sidebar({ role }: { role: 'employee' | 'employer' }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = getCurrentUser();
  const nav = role === 'employer' ? EMPLOYER_NAV : EMPLOYEE_NAV;

  const initials = user?.email
    ? user.email.split('@')[0].slice(0, 2).toUpperCase()
    : 'U';

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + '/');

  return (
    <aside className="flex h-screen w-56 flex-col bg-slate-950 shrink-0 sticky top-0 border-r border-slate-800/60">

      {/* Brand */}
      <div className="px-4 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm shrink-0">
            $
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">ExpenseApp</p>
            <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
              {role === 'employer' ? 'Employer Portal' : 'Employee Portal'}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Menu</p>
        {nav.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800',
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-blue-100' : 'text-slate-500 group-hover:text-slate-300')} />
              <span className="flex-1 leading-none">{item.label}</span>
              {active && <ChevronRight className="h-3 w-3 text-blue-300" />}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-slate-800/60">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-slate-800/50 transition-colors group">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate leading-tight">
              {user?.email?.split('@')[0] ?? 'User'}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
              {user?.role} · {user?.currency}
            </p>
          </div>
          <button
            onClick={() => { removeToken(); router.push('/login'); }}
            title="Sign out"
            className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
