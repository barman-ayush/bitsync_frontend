import { useCallback, useEffect, useRef, useState } from 'react';
import { normalizeWorkspace } from '@/lib/normalize-workspace';
import type { Workspace } from '@/types/workspaces';

export type WorkspacesStatus =
    | 'idle'
    | 'loading'
    | 'loadingMore'
    | 'success'
    | 'error';

interface UseWorkspacesResult {
    workspaces: Workspace[];
    status: WorkspacesStatus;
    error: string | null;
    hasMore: boolean;
    /** Fetch the next page; no-op while a request is in flight or once exhausted. */
    loadMore: () => void;
    /** Drop everything and re-fetch from the first page. */
    reload: () => void;
    /**
     * Insert a freshly-created workspace at the top of the list without a round
     * trip. De-duplicates by id so a later reload that returns the same row
     * doesn't double it up.
     */
    prependWorkspace: (workspace: Workspace) => void;
}

/**
 * Drives the cursor-paginated `GET /api/workspace/get-all/:repoId` endpoint for
 * infinite scrolling. The first page loads automatically whenever `repoId`
 * changes; subsequent pages are pulled in via `loadMore()` using the server's
 * `nextCursor`. A single in-flight guard prevents duplicate requests when the
 * scroll sentinel fires repeatedly.
 */
export function useWorkspaces(
    repoId: string | undefined,
    limit = 20,
): UseWorkspacesResult {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [status, setStatus] = useState<WorkspacesStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);

    // Refs keep the latest paging state available to the stable `fetchPage`
    // callback without forcing it to be re-created (and thus re-running effects).
    const cursorRef = useRef<string | null>(null);
    const loadingRef = useRef(false);
    const controllerRef = useRef<AbortController | null>(null);

    const fetchPage = useCallback(
        async (mode: 'initial' | 'more') => {
            if (!repoId || loadingRef.current) return;
            if (mode === 'more' && (!cursorRef.current || !hasMore)) return;

            loadingRef.current = true;
            setStatus(mode === 'initial' ? 'loading' : 'loadingMore');

            const controller = new AbortController();
            controllerRef.current = controller;

            const params = new URLSearchParams();
            params.set('limit', String(limit));
            if (mode === 'more' && cursorRef.current) {
                params.set('cursor', cursorRef.current);
            }

            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/workspace/get-all/${encodeURIComponent(
                        repoId,
                    )}?${params.toString()}`,
                    { credentials: 'include', signal: controller.signal },
                );
                const body = await res.json().catch(() => null);

                if (controller.signal.aborted) return;

                if (!res.ok || !Array.isArray(body?.data)) {
                    setError(body?.message ?? `Request failed with ${res.status}`);
                    setStatus('error');
                    return;
                }

                const page = body.data.map(normalizeWorkspace);
                cursorRef.current = body?.pagination?.nextCursor ?? null;
                setHasMore(Boolean(body?.pagination?.hasMore));
                setWorkspaces((prev) =>
                    mode === 'initial' ? page : [...prev, ...page],
                );
                setError(null);
                setStatus('success');
            } catch (e) {
                if (controller.signal.aborted || (e as Error).name === 'AbortError') {
                    return;
                }
                setError((e as Error).message ?? 'Network error');
                setStatus('error');
            } finally {
                loadingRef.current = false;
            }
        },
        [repoId, limit, hasMore],
    );

    // (Re)load the first page whenever the repository changes.
    useEffect(() => {
        cursorRef.current = null;
        loadingRef.current = false;
        setWorkspaces([]);
        setHasMore(false);
        setError(null);

        if (!repoId) {
            setStatus('idle');
            return;
        }
        fetchPage('initial');

        return () => {
            controllerRef.current?.abort();
        };
        // `fetchPage` intentionally excluded: we only want this to fire on repoId.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [repoId, limit]);

    const loadMore = useCallback(() => {
        fetchPage('more');
    }, [fetchPage]);

    const reload = useCallback(() => {
        cursorRef.current = null;
        setHasMore(false);
        fetchPage('initial');
    }, [fetchPage]);

    const prependWorkspace = useCallback((workspace: Workspace) => {
        setWorkspaces((prev) => [
            workspace,
            ...prev.filter((w) => w.id !== workspace.id),
        ]);
        setStatus('success');
        setError(null);
    }, []);

    return {
        workspaces,
        status,
        error,
        hasMore,
        loadMore,
        reload,
        prependWorkspace,
    };
}
