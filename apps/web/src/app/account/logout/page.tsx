'use client';

import { useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      await authClient.signOut();
      router.push('/');
    };
    performLogout();
  }, [router]);

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4 font-nunito"
      style={{ background: 'linear-gradient(135deg, #FAF5FF 0%, #FEF9F0 100%)' }}
    >
      <div className="text-center">
        <div className="text-8xl mb-6 inline-block">👋</div>
        <h2 className="text-3xl font-black text-[#3B0764] mb-3">Bye-bye!</h2>
        <p className="text-lg font-bold text-[#7E22CE]">See you next time, superstar! 🌟</p>
        <div className="mt-6 flex items-center justify-center gap-2">
          <div
            className="w-3 h-3 rounded-full bg-[#7C3AED] animate-bounce"
            style={{ animationDelay: '0ms' }}
          />
          <div
            className="w-3 h-3 rounded-full bg-[#EC4899] animate-bounce"
            style={{ animationDelay: '150ms' }}
          />
          <div
            className="w-3 h-3 rounded-full bg-[#F59E0B] animate-bounce"
            style={{ animationDelay: '300ms' }}
          />
        </div>
      </div>
    </div>
  );
}
