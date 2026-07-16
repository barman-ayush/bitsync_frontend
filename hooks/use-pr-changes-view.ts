import { useState, useEffect, useCallback } from 'react';

export interface ConflictInfo {
    conflictId: string;
    oursBlob: string | null;
    theirsBlob: string | null;
    baseBlob: string | null;
    resolvedBlob: string | null;
    resolution: 'PENDING' | 'TAKE_OURS' | 'TAKE_THEIRS' | 'MANUAL';
    conflictType: 'EDIT_EDIT' | 'DELETE_EDIT' | 'ADD_ADD' | 'DIR_FILE';
}

export interface PRChangeFile {
    path: string;
    type: string;
    changeType: 'MODIFY' | 'ADD' | 'DELETE' | 'RENAME';
    isConflicted: boolean;
    conflictInfo: ConflictInfo | null;
    oldObjectHash: string | null;
    newObjectHash: string | null;
}

export function usePrChangesView(
    repoId: string | undefined,
    workspaceId: string | undefined,
    prId: string | undefined
) {
    const [files, setFiles] = useState<PRChangeFile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchChanges = useCallback(async (signal?: AbortSignal) => {
        if (!repoId || !workspaceId || !prId) {
            setFiles([]);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/pr/changes-view/${encodeURIComponent(
                    repoId
                )}/${encodeURIComponent(workspaceId)}/${encodeURIComponent(prId)}`,
                { credentials: 'include', signal }
            );

            const json = await response.json().catch(() => null);
            if (signal?.aborted) return;

            if (!response.ok || !json?.data || !Array.isArray(json.data.files)) {
                setError(json?.message ?? `Request failed with ${response.status}`);
                return;
            }

            setFiles(json.data.files);
        } catch (err: any) {
            if (signal?.aborted || err.name === 'AbortError') return;
            setError(err.message ?? 'Network error');
        } finally {
            if (!signal?.aborted) {
                setIsLoading(false);
            }
        }
    }, [repoId, workspaceId, prId]);

    useEffect(() => {
        const controller = new AbortController();
        fetchChanges(controller.signal);
        return () => controller.abort();
    }, [fetchChanges]);

    return { files, isLoading, error, refetch: () => fetchChanges() };
}
