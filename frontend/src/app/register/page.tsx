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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RegisterForm {
  name: string; email: string; password: string;
  role: string; currency: string;
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD', 'SGD', 'CHF', 'CNY'];

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const { register, handleSubmit, setValue, watch, formState: { isSubmitting } } = useForm<RegisterForm>({
    defaultValues: { role: 'EMPLOYEE', currency: 'USD' },
  });

  const onSubmit = async (data: RegisterForm) => {
    setError('');
    try {
      const res = await api.post('/auth/register', data);
      saveToken(res.data.data.token);
      const user = getCurrentUser();
      router.push(isEmployee(user) ? '/dashboard' : '/employer/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 mb-3">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-slate-400 text-sm mt-1">Join your organisation's expense platform</p>
        </div>

        <Card className="border-slate-700 bg-slate-800/60 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-lg">New account</CardTitle>
            <CardDescription className="text-slate-400">Fill in your details to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-slate-300">Full Name</Label>
                <Input {...register('name', { required: true })} placeholder="Jane Smith"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-blue-500" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Email</Label>
                <Input type="email" {...register('email', { required: true })} placeholder="you@company.com"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-blue-500" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Password</Label>
                <Input type="password" {...register('password', { required: true, minLength: 8 })} placeholder="Min. 8 characters"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Role</Label>
                  <Select defaultValue="EMPLOYEE" onValueChange={(v) => setValue('role', v)}>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMPLOYEE">Employee</SelectItem>
                      <SelectItem value="EMPLOYER">Employer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Currency</Label>
                  <Select defaultValue="USD" onValueChange={(v) => setValue('currency', v)}>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="bg-red-900/30 border-red-700">
                  <AlertDescription className="text-red-300">{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</> : 'Create Account'}
              </Button>
            </form>

            <p className="text-center text-sm mt-4 text-slate-500">
              Already have an account?{' '}
              <a href="/login" className="text-blue-400 hover:text-blue-300 transition-colors">Sign in</a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
