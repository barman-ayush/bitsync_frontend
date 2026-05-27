import { useEffect, useState } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { isUsernameFormatValid } from '@/lib/validators/register';

export type UserSearchStatus = 'idle' | 'searching' | 'success' | 'error';

export interface UserSearchResult {
  displayName: string;
  email: string;
}

export function useUserRepositorySearch(query: string, debounceMs = 400, repoId = "") {
  const debouncedQuery = useDebounce(query.trim(), debounceMs);
  const [status, setStatus] = useState<UserSearchStatus>('idle');
  const [results, setResults] = useState<UserSearchResult[]>([]);

  useEffect(() => {
    if (!debouncedQuery || !isUsernameFormatValid(debouncedQuery)) {
      setStatus('idle');
      setResults([]);
      return;
    }

    let cancelled = false;
    setStatus('searching');

    (async () => {
      try {
        const uri = (repoId === "") ? `${process.env.NEXT_PUBLIC_API_URL}/api/user/search/${encodeURIComponent(debouncedQuery)}`
          : `${process.env.NEXT_PUBLIC_API_URL}/api/user/search/repo/${encodeURIComponent(debouncedQuery)}/${repoId}`;
        const res = await fetch(uri, { credentials: 'include' });
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && Array.isArray(data?.data)) {
          setResults(data.data as UserSearchResult[]);
          setStatus('success');
        } else {
          setResults([]);
          setStatus('error');
        }
      } catch {
        if (!cancelled) {
          setResults([]);
          setStatus('error');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  return { status, results, debouncedQuery };
}
