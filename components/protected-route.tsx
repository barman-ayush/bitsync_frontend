'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/contexts/user.context';

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

    let cancelled = false;

    async function verify() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/user/data`,
          { credentials: 'include', redirect: 'manual' },
        );

        // Backend sent a redirect (auth failed) — opaque redirect has type "opaqueredirect"
        if (res.type === 'opaqueredirect' || res.status === 0) {
          // Can't read redirect Location with opaque response,
          // fall back to a full page reload so the browser follows the redirect natively
          window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/user/data`;
          return;
        }

        if (!res.ok) {
          router.replace('/?toast=Please log in to continue&toastType=error');
          return;
        }

        const json = await res.json();

        if (!cancelled && json.status === 'success' && json.data) {
          setUser(json.data);
          setStatus('authorized');
        }
      } catch {
        if (!cancelled) {
          router.replace('/?toast=Something went wrong&toastType=error');
        }
      }
    }

    verify();

    return () => {
      cancelled = true;
    };
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
