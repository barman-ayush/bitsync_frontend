import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseUncommittedStatusResult {
    /** A status request is in flight. */
    isLoading: boolean;
    /** The workspace has staged changes waiting to be committed. */
    hasUncommittedChanges: boolean;
    /** Re-fetch the status after a stage or commit has changed it. */
    refresh: () => void;
}

/**
 * Tracks whether the active workspace has staged-but-uncommitted changes via
 * `GET /api/workspace/uncommitted/status/:repoId/:workspaceId`. The commit
 * button reads this to stay disabled when there is nothing to commit. The
 * status is re-fetched whenever the workspace changes; callers nudge it with
 * `refresh()` after staging (which creates uncommitted changes) or committing
 * (which clears them).
 *
 * The backend responds with `{ data: { hasChanges: boolean } }`. On any failure
 * the status falls back to "nothing to commit" so the commit button errs toward
 * disabled rather than firing a request with no changes.
 */
export function useUncommittedStatus(
    repoId: string | undefined,
    workspaceId: string | undefined,
): UseUncommittedStatusResult {
    const [isLoading, setIsLoading] = useState(false);
    const [hasUncommittedChanges, setHasUncommittedChanges] = useState(false);

    const controllerRef = useRef<AbortController | null>(null);

    const fetchStatus = useCallback(async () => {
        if (!repoId || !workspaceId) {
            setHasUncommittedChanges(false);
            return;
        }

        controllerRef.current?.abort();
        const controller = new AbortController();
        controllerRef.current = controller;
        setIsLoading(true);

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/workspace/uncommitted/status/${encodeURIComponent(
                    repoId,
                )}/${encodeURIComponent(workspaceId)}`,
                { credentials: 'include', signal: controller.signal },
            );
            const body = await res.json().catch(() => null);
            if (controller.signal.aborted) return;

            if (!res.ok || !body?.data) {
                setHasUncommittedChanges(false);
                return;
            }

            const data = body.data as { hasChanges?: boolean };
            setHasUncommittedChanges(data.hasChanges === true);
        } catch (e) {
            if (controller.signal.aborted || (e as Error).name === 'AbortError') {
                return;
            }
            setHasUncommittedChanges(false);
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

    return { isLoading, hasUncommittedChanges, refresh };
}
