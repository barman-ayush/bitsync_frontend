import { useState, useEffect } from 'react';

export interface PRDetails {
    id: string;
    repoId: string;
    workspaceId: string | null;
    authorId: string;
    title: string;
    description: string | null;
    status: 'OPEN' | 'MERGED' | 'CLOSED';
    prHead: string;
    baseCommit: string | null;
    mergeCommit: string | null;
    createdAt: string;
    updatedAt: string;
    author?: {
        id: string;
        username: string;
        displayName: string;
    };
    workspace?: {
        id: string;
        name: string;
    };
    comments?: PRComment[];
}

export interface PRComment {
    id: string;
    prId: string;
    authorId: string;
    body: string;
    filePath: string | null;
    createdAt: string;
    updatedAt: string;
    author?: {
        id: string;
        username: string;
        displayName: string;
        avatarUrl?: string | null;
    };
}

export function usePRDetails(repoId: string, prId: string) {
    const [pr, setPr] = useState<PRDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function fetchDetails() {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pr/details/${repoId}/${prId}`, {
                    credentials: 'include'
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch PR details');
                }
                const json = await response.json();
                if (isMounted) {
                    setPr(json.data);
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

        fetchDetails();

        return () => {
            isMounted = false;
        };
    }, [repoId, prId]);

    return { pr, isLoading, error };
}
