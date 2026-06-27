import { useCallback, useEffect, useRef, useState } from 'react';

export type PRStatus = 'CREATE_PR' | 'IN_SYNC' | 'PENDING_SYNC';

export interface UsePRStatusResult {
    /** A status request is in flight. */
    isLoading: boolean;
    /** The PR sync status of the workspace. */
    status: PRStatus | null;
    /** Re-fetch the status after PR creation or sync. */
    refresh: () => void;
}

/**
 * Tracks the PR status of the active workspace via
 * `GET /api/pr/status/:repoId/:workspaceId`.
 * 
 * The backend responds with `{ data: 'CREATE_PR' | 'IN_SYNC' | 'PENDING_SYNC' }`.
 */
export function usePRStatus(
    repoId: string | undefined,
    workspaceId: string | undefined,
): UsePRStatusResult {
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<PRStatus | null>(null);

    const controllerRef = useRef<AbortController | null>(null);

    const fetchStatus = useCallback(async () => {
        if (!repoId || !workspaceId) {
            setStatus(null);
            return;
        }

        controllerRef.current?.abort();
        const controller = new AbortController();
        controllerRef.current = controller;
        setIsLoading(true);

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/pr/status/${encodeURIComponent(
                    repoId,
                )}/${encodeURIComponent(workspaceId)}`,
                { credentials: 'include', signal: controller.signal },
            );
            const body = await res.json().catch(() => null);
            if (controller.signal.aborted) return;

            if (!res.ok || !body?.data) {
                setStatus(null);
                return;
            }

            // The backend returns `{ data: "CREATE_PR" }` directly (it is a string)
            setStatus((body.data as PRStatus) ?? null);
        } catch (e) {
            if (controller.signal.aborted || (e as Error).name === 'AbortError') {
                return;
            }
            setStatus(null);
        } finally {
            if (!controller.signal.aborted) setIsLoading(false);
        }
    }, [repoId, workspaceId]);

    // Re-check whenever the workspace changes; abort an in-flight check on switch.
    useEffect(() => {
        fetchStatus();
        return () => controllerRef.current?.abort();
    }, [fetchStatus]);

    const refresh = useCallback(() => {
        fetchStatus();
    }, [fetchStatus]);

    return { isLoading, status, refresh };
}
