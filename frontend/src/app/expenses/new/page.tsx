'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewExpenseRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/expenses'); }, []);
  return null;
}
