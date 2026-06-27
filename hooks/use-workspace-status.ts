import { useCallback, useEffect, useRef, useState } from 'react';

export type WorkspaceSyncStatus = 'DIRTY' | 'CLEAN';

export interface UseWorkspaceStatusResult {
    /** A status request is in flight. */
    isLoading: boolean;
    /** The sync status of the workspace. */
    status: WorkspaceSyncStatus | null;
    /** Re-fetch the status after a stage or commit has changed it. */
    refresh: () => void;
}

/**
 * Tracks the sync status of the active workspace via
 * `GET /api/workspace/status/:repoId/:workspaceId`.
 * 
 * The backend responds with `{ data: { status: 'DIRTY' | 'CLEAN' } }`.
 */
export function useWorkspaceStatus(
    repoId: string | undefined,
    workspaceId: string | undefined,
): UseWorkspaceStatusResult {
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<WorkspaceSyncStatus | null>(null);

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
                `${process.env.NEXT_PUBLIC_API_URL}/api/workspace/status/${encodeURIComponent(
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

            const data = body.data as { status?: WorkspaceSyncStatus };
            setStatus(data.status ?? null);
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
