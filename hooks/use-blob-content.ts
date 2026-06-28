import { useState, useEffect } from 'react';

export function useBlobContent(repoId: string | undefined, blobHash: string | null | undefined) {
    const [url, setUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!repoId || !blobHash) {
            setUrl(null);
            setIsLoading(false);
            setError(null);
            return;
        }

        let isMounted = true;
        const controller = new AbortController();

        async function fetchBlob() {
            setIsLoading(true);
            setError(null);
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/workspace/blob/${encodeURIComponent(
                        repoId!
                    )}/${encodeURIComponent(blobHash!)}`,
                    { credentials: 'include', signal: controller.signal }
                );

                if (controller.signal.aborted) return;
                if (!res.ok) {
                    const body = await res.json().catch(() => null);
                    setError(body?.message ?? `Failed to load blob (${res.status})`);
                    return;
                }

                const body = await res.json();
                if (isMounted) {
                    setUrl(body?.data?.url ?? null);
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

        fetchBlob();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [repoId, blobHash]);

    return { url, isLoading, error };
}
