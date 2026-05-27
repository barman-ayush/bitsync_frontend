import { useEffect, useState } from 'react';
import { useDebounce } from '@/hooks/use-debounce';

export type RepoNameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';

export function useRepoNameAvailability(repoName: string, debounceMs = 500) {
  const debouncedRepoName = useDebounce(repoName.trim(), debounceMs);
  const [status, setStatus] = useState<RepoNameStatus>('idle');

  useEffect(() => {
    if (!debouncedRepoName) {
      setStatus('idle');
      return;
    }

    let cancelled = false;
    setStatus('checking');

    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/repo/check-name/${encodeURIComponent(debouncedRepoName)}`,
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
  }, [debouncedRepoName]);

  return { status, debouncedRepoName };
}
