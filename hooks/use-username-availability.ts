import { useEffect, useState } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { isUsernameFormatValid } from '@/lib/validators/register';

export type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';

export function useUsernameAvailability(username: string, debounceMs = 500) {
  const debouncedUsername = useDebounce(username, debounceMs);
  const [status, setStatus] = useState<UsernameStatus>('idle');

  useEffect(() => {
    if (!isUsernameFormatValid(debouncedUsername)) {
      setStatus('idle');
      return;
    }

    let cancelled = false;
    setStatus('checking');

    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/user/check-username/${encodeURIComponent(debouncedUsername)}`,
          { credentials: 'include' },
        );
        const data = await res.json();
        if (cancelled) return;
        setStatus(data?.data?.available === true ? 'available' : 'taken');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedUsername]);

  return { status, debouncedUsername };
}
