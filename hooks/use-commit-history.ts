import { useEffect, useRef, useState } from 'react';
import type { CommitAuthor, CommitSummary } from '@/types/commits';

export type CommitHistoryStatus = 'idle' | 'loading' | 'success' | 'error';

export interface UseCommitHistoryResult {
    /** Commits for the workspace, newest first. */
    commits: CommitSummary[];
    status: CommitHistoryStatus;
    error: string | null;
}

/** A raw entry as returned by `GET /commit/history/:repoId/:workspaceId`. */
interface CommitHistoryEntry {
    commitHash: string;
    parent: string | null;
    rootTree: string;
    author: string;
    message: string;
    timestamp: string;
}

/** Split the stored `"Name <email>"` author string into its parts. */
function parseAuthor(author: string): CommitAuthor {
    const match = author.match(/^(.*?)\s*<([^>]*)>\s*$/);
    if (match) {
        const email = match[2].trim();
        return { name: match[1].trim() || email, email };
    }
    return { name: author.trim(), email: '' };
}

function toSummary(entry: CommitHistoryEntry): CommitSummary {
    return {
        hash: entry.commitHash,
        message: entry.message,
        author: parseAuthor(entry.author),
        createdAt: entry.timestamp,
        parent: entry.parent,
        rootTree: entry.rootTree,
    };
}

/**
 * Loads a workspace's commit history (newest first) from
 * `GET /api/commit/history/:repoId/:workspaceId`. Reloads whenever the
 * repo/workspace changes; an in-flight request is aborted on change/unmount.
 *
 * Only the first page is fetched for now — the endpoint is keyset-paginated, so
 * a "load more" can later page on `pagination.nextCursor`.
 */
export function useCommitHistory(
    repoId: string | undefined,
    workspaceId: string | undefined,
): UseCommitHistoryResult {
    const [commits, setCommits] = useState<CommitSummary[]>([]);
    const [status, setStatus] = useState<CommitHistoryStatus>('idle');
    const [error, setError] = useState<string | null>(null);

    const controllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        if (!repoId || !workspaceId) {
            setCommits([]);
            setStatus('idle');
            setError(null);
            return;
        }

        controllerRef.current?.abort();
        const controller = new AbortController();
        controllerRef.current = controller;

        setStatus('loading');
        setError(null);

        (async () => {
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/commit/history/${encodeURIComponent(
                        repoId,
                    )}/${encodeURIComponent(workspaceId)}`,
                    { credentials: 'include', signal: controller.signal },
                );
                const body = await res.json().catch(() => null);
                if (controller.signal.aborted) return;

                if (!res.ok || !Array.isArray(body?.data)) {
                    setError(body?.message ?? `Request failed with ${res.status}`);
                    setStatus('error');
                    return;
                }

                setCommits((body.data as CommitHistoryEntry[]).map(toSummary));
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
    }, [repoId, workspaceId]);

    return { commits, status, error };
}
