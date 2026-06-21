import { useCallback, useState } from 'react';
import { useToast } from '@/components/toast-provider';

/** The commit returned by the backend on success. */
export interface CommitResult {
    /** 64-char sha256 of the new commit. */
    commitHash: string;
    /** New root tree hash. */
    rootTree: string;
    /** Previous workspace head; `null` for the first commit. */
    parent: string | null;
    /** Number of changes baked into this commit. */
    changeCount: number;
}

export interface UseCommitResult {
    /** The commit request is in flight. */
    isCommitting: boolean;
    /**
     * Commit the workspace's staged changes with `message`. On success returns
     * the new commit and shows a toast; on failure returns `null` and toasts the
     * error. The author is taken from the JWT and the changes from
     * `workspace_changes`, so only the message is sent.
     */
    commit: (message: string) => Promise<CommitResult | null>;
}

/**
 * Owns the workspace commit request: `POST /api/commit/:repoId/:workspaceId`
 * with `{ message }`. Bakes the workspace's uncommitted changes into a new
 * commit.
 */
export function useCommit(
    repoId: string | undefined,
    workspaceId: string | undefined,
): UseCommitResult {
    const { addToast } = useToast();
    const [isCommitting, setIsCommitting] = useState(false);

    const commit = useCallback(
        async (message: string): Promise<CommitResult | null> => {
            const trimmed = message.trim();
            if (!repoId || !workspaceId || trimmed.length === 0) return null;

            setIsCommitting(true);
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/commit/${encodeURIComponent(
                        repoId,
                    )}/${encodeURIComponent(workspaceId)}`,
                    {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: trimmed }),
                    },
                );
                const body = await res.json().catch(() => null);

                if (!res.ok) {
                    addToast(body?.message ?? 'Could not create the commit.', 'error');
                    return null;
                }

                const data = body?.data as CommitResult | undefined;
                const count = data?.changeCount ?? 0;
                addToast(
                    body?.message ??
                        `Committed ${count} change${count === 1 ? '' : 's'}.`,
                    'success',
                );
                return data ?? null;
            } catch {
                addToast(
                    'Something went wrong while committing. Please try again.',
                    'error',
                );
                return null;
            } finally {
                setIsCommitting(false);
            }
        },
        [repoId, workspaceId, addToast],
    );

    return { isCommitting, commit };
}
