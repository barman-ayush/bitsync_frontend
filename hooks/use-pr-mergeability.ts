import { useState, useEffect, useCallback } from 'react';

export interface PrMergeability {
    canMerge: boolean;
    conflictCount: number;
    totalConflictCount: number;
    hasMergeState: boolean;
    prStatus?: string;
    isMerged?: boolean;
}

export function usePrMergeability(repoId: string, workspaceId: string | null | undefined, prId: string) {
    const [mergeability, setMergeability] = useState<PrMergeability | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const refresh = useCallback(() => {
        setRefreshTrigger((prev) => prev + 1);
    }, []);

    useEffect(() => {
        const wId = workspaceId;
        if (!wId) return;

        let isMounted = true;

        async function fetchMergeability() {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/pr/mergeability/${encodeURIComponent(repoId)}/${encodeURIComponent(wId!)}/${encodeURIComponent(prId)}`,
                    { credentials: 'include' }
                );
                if (!response.ok) {
                    throw new Error('Failed to fetch PR mergeability');
                }
                const json = await response.json();
                if (isMounted) {
                    setMergeability(json.data);
                }
            } catch (err: any) {
                if (isMounted) {
                    setError(err);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        fetchMergeability();

        return () => {
            isMounted = false;
        };
    }, [repoId, workspaceId, prId, refreshTrigger]);

    return { mergeability, isLoading, error, refresh };
}
