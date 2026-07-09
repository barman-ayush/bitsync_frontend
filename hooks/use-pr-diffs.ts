import { useState, useEffect } from 'react';

export interface DiffEntry {
    path: string;
    type: 'blob' | 'tree';
    changeType: 'ADD' | 'MODIFY' | 'DELETE' | 'RENAME';
    oldObjectHash?: string;
    newObjectHash?: string;
    oldPath?: string;
    size?: number;
}

export function usePrCommitChanges(repoId: string | undefined, prId: string | undefined) {
    const [diffs, setDiffs] = useState<DiffEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!repoId || !prId) {
            setDiffs([]);
            return;
        }

        let isMounted = true;
        const controller = new AbortController();

        async function fetchDiffs() {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/pr/commit-changes/${encodeURIComponent(
                        repoId!
                    )}/${encodeURIComponent(prId!)}`,
                    { credentials: 'include', signal: controller.signal }
                );

                const json = await response.json().catch(() => null);
                if (controller.signal.aborted) return;

                if (!response.ok || !Array.isArray(json?.data)) {
                    setError(json?.message ?? `Request failed with ${response.status}`);
                    return;
                }

                if (isMounted) {
                    setDiffs(json.data);
                }
            } catch (err: any) {
                if (controller.signal.aborted || err.name === 'AbortError') return;
                if (isMounted) {
                    setError(err.message ?? 'Network error');
                }
            } finally {
                if (!controller.signal.aborted && isMounted) {
                    setIsLoading(false);
                }
            }
        }

        fetchDiffs();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [repoId, prId]);

    return { diffs, isLoading, error };
}
