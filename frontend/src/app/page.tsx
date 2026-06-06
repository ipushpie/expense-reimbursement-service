'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, isEmployee } from '@/lib/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace('/login');
    } else if (isEmployee(user)) {
      router.replace('/dashboard');
    } else {
      router.replace('/employer/dashboard');
    }
  }, [router]);

  return null;
}
