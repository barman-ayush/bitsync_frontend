import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/components/toast-provider';

export interface PullRequestRow {
    id: string;
    repoId: string;
    workspaceId: string | null;
    authorId: string;
    title: string;
    description: string | null;
    status: 'OPEN' | 'MERGED' | 'CLOSED';
    prHead: string;
    baseCommit: string | null;
    mergeCommit: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface UsePRListResult {
    prs: PullRequestRow[];
    isLoading: boolean;
    hasMore: boolean;
    loadMore: () => void;
    refresh: () => void;
}

export function usePRList(repoId: string | undefined, searchQuery: string): UsePRListResult {
    const { addToast } = useToast();
    const [prs, setPrs] = useState<PullRequestRow[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);

    const fetchPRs = useCallback(
        async (cursor: string | null, isRefresh = false, signal?: AbortSignal) => {
            if (!repoId) return;

            setIsLoading(true);
            try {
                const url = new URL(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/pr/list/${encodeURIComponent(repoId)}`
                );
                url.searchParams.set('limit', '20');
                if (cursor) {
                    url.searchParams.set('cursor', cursor);
                }
                if (searchQuery) {
                    url.searchParams.set('q', searchQuery);
                }

                const res = await fetch(url.toString(), {
                    credentials: 'include',
                    signal,
                });

                if (signal?.aborted) return;

                if (!res.ok) {
                    const errorBody = await res.json().catch(() => null);
                    addToast(errorBody?.message ?? 'Failed to fetch PRs', 'error');
                    return;
                }

                const body = await res.json();
                if (body.status === 'success') {
                    const newPrs: PullRequestRow[] = body.data;
                    setPrs((prev) => (isRefresh ? newPrs : [...prev, ...newPrs]));
                    setHasMore(body.pagination?.hasMore ?? false);
                    setNextCursor(body.pagination?.nextCursor ?? null);
                }
            } catch (error: any) {
                if (signal?.aborted || error.name === 'AbortError') return;
                console.error(error);
                addToast('An unexpected error occurred while fetching PRs.', 'error');
            } finally {
                if (!signal?.aborted) {
                    setIsLoading(false);
                }
            }
        },
        [repoId, searchQuery, addToast]
    );

    useEffect(() => {
        const controller = new AbortController();
        setPrs([]);
        setNextCursor(null);
        setHasMore(false);
        fetchPRs(null, true, controller.signal);
        return () => controller.abort();
    }, [repoId, searchQuery, fetchPRs]);

    const loadMore = useCallback(() => {
        if (!isLoading && hasMore && nextCursor) {
            fetchPRs(nextCursor, false);
        }
    }, [isLoading, hasMore, nextCursor, fetchPRs]);

    const refresh = useCallback(() => {
        fetchPRs(null, true);
    }, [fetchPRs]);

    return {
        prs,
        isLoading,
        hasMore,
        loadMore,
        refresh,
    };
}
