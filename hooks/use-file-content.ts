import { useEffect, useState } from 'react';
import type { SelectedWorkspaceFile } from '@/types/workspace-tree';

export type FileContentStatus = 'idle' | 'loading' | 'success' | 'error';

export interface UseFileContentResult {
    status: FileContentStatus;
    /** The fetched file contents URL. */
    url: string | null;
    error: string | null;
}

/**
 * Fetches the contents of the selected file. Re-runs whenever the file changes
 * and aborts the previous request, so quickly clicking through files never races.
 *
 * NOTE: the backend endpoint doesn't exist yet — the URL below is a placeholder
 * that fetches a blob by its content hash. Swap it for the real route once it's
 * added; the loading/error/success wiring around it won't need to change. The
 * response is read as JSON (`{ data: { content } }`) when the server says it's
 * JSON, otherwise as raw text.
 */
export function useFileContent(
    repoId: string | undefined,
    workspaceId: string | undefined,
    file: SelectedWorkspaceFile | null,
): UseFileContentResult {
    const [status, setStatus] = useState<FileContentStatus>('idle');
    const [url, setUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const objectHash = file?.objectHash ?? null;
    const filePath = file?.path ?? null;

    useEffect(() => {
        if (!repoId || !workspaceId || !file) {
            setStatus('idle');
            setUrl(null);
            setError(null);
            return;
        }

        if (!objectHash) {
            setStatus('error');
            setUrl(null);
            setError('This file has no content to load yet.');
            return;
        }

        const controller = new AbortController();
        setStatus('loading');
        setUrl(null);
        setError(null);

        (async () => {
            try {
                // TODO: replace with the real file-content endpoint when ready.
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/workspace/blob/${encodeURIComponent(
                        repoId,
                    )}/${encodeURIComponent(objectHash)}`,
                    { credentials: 'include', signal: controller.signal },
                );
                if (controller.signal.aborted) return;

                if (!res.ok) {
                    const body = await res.json().catch(() => null);
                    setError(body?.message ?? `Request failed with ${res.status}`);
                    setStatus('error');
                    return;
                }

                const body = await res.json();
                const blobUrl = body?.data?.url;
                
                if (!blobUrl) {
                    setError('Received invalid response from server (missing URL).');
                    setStatus('error');
                    return;
                }
                
                setUrl(blobUrl);
                setStatus('success');
            } catch (e) {
                if (controller.signal.aborted || (e as Error).name === 'AbortError') {
                    return;
                }
                setError((e as Error).message ?? 'Network error');
                setStatus('error');
            }
        })();

        return () => controller.abort();
        // Re-fetch on a genuinely different file; path disambiguates same-hash blobs.
    }, [repoId, workspaceId, file, objectHash, filePath]);

    return { status, url, error };
}
