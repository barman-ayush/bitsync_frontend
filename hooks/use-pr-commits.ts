import { useState, useEffect } from 'react';

export interface CommitTrailEntry {
    message: string;
    commitHash: string;
    timestamp: string;
}

export function usePRCommits(
    repoId: string | undefined,
    workspaceId: string | null | undefined,
    prId?: string
) {
    const [commits, setCommits] = useState<CommitTrailEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!repoId || !workspaceId) {
            setCommits([]);
            return;
        }

        let isMounted = true;
        const controller = new AbortController();

        async function fetchCommits() {
            setIsLoading(true);
            setError(null);
            try {
                let url = `${process.env.NEXT_PUBLIC_API_URL}/api/pr/commit-trail/${encodeURIComponent(
                    repoId!
                )}/${encodeURIComponent(workspaceId!)}`;
                if (prId) {
                    url += `/${encodeURIComponent(prId)}`;
                }

                const response = await fetch(
                    url,
                    { credentials: 'include', signal: controller.signal }
                );
                
                const json = await response.json().catch(() => null);
                if (controller.signal.aborted) return;
                
                if (!response.ok || !Array.isArray(json?.data)) {
                    setError(json?.message ?? `Request failed with ${response.status}`);
                    return;
                }
                
                if (isMounted) {
                    setCommits(json.data);
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

        fetchCommits();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [repoId, workspaceId]);

    return { commits, isLoading, error };
}
