import { useEffect, useState } from 'react';
import { useDebounce } from '@/hooks/use-debounce';

export type WorkspaceNameStatus =
    | 'idle'
    | 'checking'
    | 'available'
    | 'taken'
    | 'error';

/**
 * Debounced availability check for a workspace name within a repo, backed by
 * `GET /api/workspace/check/:repoId/:workspaceName`. Mirrors
 * `useRepoNameAvailability`, but scoped to a repository: the same name can exist
 * under different repos, so the check is keyed by both `repoId` and the name.
 */
export function useWorkspaceNameAvailability(
    repoId: string | undefined,
    name: string,
    debounceMs = 500,
) {
    const debouncedName = useDebounce(name.trim(), debounceMs);
    const [status, setStatus] = useState<WorkspaceNameStatus>('idle');

    useEffect(() => {
        if (!repoId || !debouncedName) {
            setStatus('idle');
            return;
        }

        let cancelled = false;
        setStatus('checking');

        (async () => {
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/workspace/check/${encodeURIComponent(
                        repoId,
                    )}/${encodeURIComponent(debouncedName)}`,
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
    }, [repoId, debouncedName]);

    return { status, debouncedName };
}
