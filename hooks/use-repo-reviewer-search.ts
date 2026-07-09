import { useEffect, useState } from 'react';
import { useDebounce } from '@/hooks/use-debounce';

export type ReviewerSearchStatus = 'idle' | 'searching' | 'success' | 'error';

export interface ReviewerSearchResult {
  id: string;
  displayName: string;
  username: string;
  email: string;
  avatarUrl?: string | null;
  role: string;
}

export function useRepoReviewerSearch(repoId: string, query: string, debounceMs = 400) {
  const debouncedQuery = useDebounce(query.trim(), debounceMs);
  const [status, setStatus] = useState<ReviewerSearchStatus>('idle');
  const [results, setResults] = useState<ReviewerSearchResult[]>([]);

  useEffect(() => {
    let cancelled = false;
    setStatus('searching');

    (async () => {
      try {
        const queryParam = debouncedQuery ? `?q=${encodeURIComponent(debouncedQuery)}` : '';
        const uri = `${process.env.NEXT_PUBLIC_API_URL}/api/repo/${encodeURIComponent(repoId)}/reviewers/search${queryParam}`;
        const res = await fetch(uri, { credentials: 'include' });
        const data = await res.json();
        if (cancelled) return;
        
        if (res.ok && Array.isArray(data?.data)) {
          setResults(data.data as ReviewerSearchResult[]);
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
  }, [debouncedQuery, repoId]);

  return { status, results, debouncedQuery };
}
