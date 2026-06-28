import { useState, useEffect } from 'react';

export interface MergeConflict {
    filePath: string;
    conflictType: 'EDIT_EDIT' | 'ADD_ADD' | 'DELETE_EDIT';
    baseBlob?: string | null;
    oursBlob?: string | null;
    theirsBlob?: string | null;
}

export interface MergedPathEntry {
    oldBlobHash?: string | null;
    newBlobHash: string;
}

export interface MergeCheckData {
    canMerge: boolean;
    isFastForward: boolean;
    baseCommit: string | null;
    oursCommit: string | null;
    theirsCommit: string;
    stats: {
        totalFiles: number;
        cleanFiles: number;
        conflictCount: number;
    };
    conflicts: MergeConflict[];
    mergedPaths: Record<string, MergedPathEntry>;
}

export function useMergeCheck(repoId: string | undefined, workspaceId: string | undefined) {
    const [data, setData] = useState<MergeCheckData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!repoId || !workspaceId) {
            setData(null);
            return;
        }

        let isMounted = true;
        const controller = new AbortController();

        async function fetchMergeCheck() {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/pr/merge-check/${encodeURIComponent(
                        repoId!
                    )}/${encodeURIComponent(workspaceId!)}`,
                    { credentials: 'include', signal: controller.signal }
                );

                const json = await response.json().catch(() => null);
                if (controller.signal.aborted) return;

                if (!response.ok || !json?.data) {
                    setError(json?.message ?? `Request failed with ${response.status}`);
                    return;
                }

                if (isMounted) {
                    setData(json.data);
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

        fetchMergeCheck();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [repoId, workspaceId]);

    return { data, isLoading, error };
}
