import { useEffect, useState } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import type { RepoListData, RepoListFilters } from '@/types/repos';

export type RepoListStatus = 'idle' | 'loading' | 'success' | 'error';

interface UseRepoListResult {
    data: RepoListData | null;
    status: RepoListStatus;
    error: string | null;
}

export function useRepoList(filters: RepoListFilters, debounceMs = 350): UseRepoListResult {
    const debouncedQ = useDebounce(filters.q ?? '', debounceMs);

    const [data, setData] = useState<RepoListData | null>(null);
    const [status, setStatus] = useState<RepoListStatus>('idle');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const controller = new AbortController();
        setStatus('loading');

        const params = new URLSearchParams();
        if (debouncedQ) params.set('q', debouncedQ);
        if (filters.owner) params.set('owner', filters.owner);
        if (filters.role) params.set('role', filters.role);
        if (filters.created_from) params.set('created_from', filters.created_from);
        if (filters.created_to) params.set('created_to', filters.created_to);
        if (filters.has_commits) params.set('has_commits', filters.has_commits);
        params.set('sort', filters.sort);
        params.set('direction', filters.direction);
        params.set('page', String(filters.page));
        params.set('per_page', String(filters.per_page));

        (async () => {
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/repo/?${params.toString()}`,
                    { credentials: 'include', signal: controller.signal },
                );
                const body = await res.json().catch(() => null);
                if (cancelled) return;
                if (!res.ok) {
                    setError(body?.message ?? `Request failed with ${res.status}`);
                    setStatus('error');
                    return;
                }
                setData(body?.data ?? null);
                setError(null);
                setStatus('success');
            } catch (e) {
                if (cancelled || (e as Error).name === 'AbortError') return;
                setError((e as Error).message ?? 'Network error');
                setStatus('error');
            }
        })();

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [
        debouncedQ,
        filters.owner,
        filters.role,
        filters.created_from,
        filters.created_to,
        filters.has_commits,
        filters.sort,
        filters.direction,
        filters.page,
        filters.per_page,
    ]);

    return { data, status, error };
}
