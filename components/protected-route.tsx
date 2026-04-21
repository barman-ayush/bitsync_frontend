'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/user.context';



export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push(`/auth/login?toast="Please login to continue!!"&toastType="error"`);
    }
  }, [user, isLoading]);

  if (isLoading || !user) {
    return null;
  }

  return <>{children}</>;
}
