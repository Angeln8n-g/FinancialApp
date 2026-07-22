'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('hogariq_token');
    if (token) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-500 border-t-transparent" />
    </div>
  );
}
