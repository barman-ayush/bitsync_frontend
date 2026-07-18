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
      router.push(`/auth?toast="Please login to continue!!"&toastType="error"`);
      return;
    }
    if (!user.emailVerified) {
      router.push('/auth/verify-email');
    }
  }, [user, isLoading]);

  if (isLoading || !user) {
    return null;
  }

  if (!user.emailVerified) {
    return null;
  }

  return <>{children}</>;
}
