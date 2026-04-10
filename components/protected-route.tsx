'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/contexts/user.context';
import { ErrorResponse, AuthSuccessResponse } from '@/types';

const PROTECTED_ROUTES: string[] = [];

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/'),
  );
}


export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, setUser } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'authorized' | 'public'>('loading');

  useEffect(() => {
    if (!isProtectedRoute(pathname)) {
      setStatus('public');
      return;
    }

    if (user) {
      setStatus('authorized');
      return;
    }


    async function verify() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/user/data`,
          { credentials: 'include', redirect: 'manual' },
        );

        const data = await res.json();

        if (!res.ok) {
          const error = data as ErrorResponse;
          router.replace(`/?toast=${error.message}&toastType=${error.status}`);
          return;
        }

        const successData = data as AuthSuccessResponse;
        setUser({
          id: successData.data.id,
          email: successData.data.email,
          displayName: successData.data.displayName,
          avatarUrl: successData.data.avatarUrl,
          emailVerified: successData.data.emailVerified,
          createdAt: String(successData.data.createdAt),
        });
        setStatus('authorized');

      } catch {
        router.replace(`/?toast=Something went wrong&toastType=error`);
      }
    }

    verify();

    return () => { };
  }, [pathname, user, setUser, router]);

  // Public route — render immediately
  if (status === 'public') return <>{children}</>;

  // Protected route — show loading while verifying
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Authorized
  return <>{children}</>;
}
