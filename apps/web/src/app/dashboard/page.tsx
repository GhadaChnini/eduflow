'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export default function DashboardRedirect() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/account/signin');
      return;
    }

    if (session) {
      const fetchRole = async () => {
        const res = await fetch('/api/profile');
        const data = await res.json();
        if (data.user) {
          const userRole = data.user.role;
          if (userRole === 'admin') router.push('/admin');
          else if (userRole === 'teacher') router.push('/teacher');
          else router.push('/student');
        }
      };
      fetchRole();
    }
  }, [session, isPending, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 font-inter">
      <div className="text-sm font-medium text-gray-500">Redirecting to your dashboard...</div>
    </div>
  );
}
