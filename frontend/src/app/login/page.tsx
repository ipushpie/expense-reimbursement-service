'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Building2, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { saveToken, getCurrentUser, isEmployee } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LoginForm { email: string; password: string; }

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setError('');
    try {
      const res = await api.post('/auth/login', data);
      saveToken(res.data.data.token);
      const user = getCurrentUser();
      router.push(isEmployee(user) ? '/dashboard' : '/employer/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 mb-3">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">ExpenseApp</h1>
          <p className="text-slate-400 text-sm mt-1">Expense reimbursement platform</p>
        </div>

        <Card className="border-slate-700 bg-slate-800/60 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-lg">Sign in to your account</CardTitle>
            <CardDescription className="text-slate-400">Enter your credentials below</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-slate-300" htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  {...register('email', { required: true })}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300" htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register('password', { required: true })}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
                />
              </div>

              {error && (
                <Alert variant="destructive" className="bg-red-900/30 border-red-700">
                  <AlertDescription className="text-red-300">{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</> : 'Sign In'}
              </Button>
            </form>

            <p className="text-center text-sm mt-4 text-slate-500">
              No account?{' '}
              <a href="/register" className="text-blue-400 hover:text-blue-300 transition-colors">Create one</a>
            </p>

            <div className="mt-6 pt-5 border-t border-slate-700">
              <p className="text-[11px] text-slate-600 text-center font-medium uppercase tracking-wide mb-3">Demo credentials</p>
              <div className="space-y-1.5 text-[11px] text-slate-500">
                <div className="flex justify-between"><span>Employer (EUR):</span><span className="font-mono">employer@acme.com / Employer@1234</span></div>
                <div className="flex justify-between"><span>Employee (USD):</span><span className="font-mono">alice@acme.com / Employee@1234</span></div>
                <div className="flex justify-between"><span>Employee (INR):</span><span className="font-mono">bob@acme.com / Employee@1234</span></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
