import { useCallback, useState } from 'react';
import { useToast } from '@/components/toast-provider';
import type { PendingChange } from '@/types/workspace-tree';

export interface UsePendingChangesResult {
    /** Queued, not-yet-staged changes, keyed by their full path. */
    changes: PendingChange[];
    /** A blob upload is in flight. */
    isUploading: boolean;
    /** The stage request is in flight. */
    isStaging: boolean;
    /**
     * Upload one or more files into `folderPath` (a directory path ending in
     * `/`, or `''` for the root). Each file's bytes are POSTed to the blob
     * endpoint and the returned hash queued as a pending change. Re-uploading a
     * path replaces its queued entry. Resolves with how many succeeded/failed.
     */
    uploadFiles: (
        files: File[],
        folderPath: string,
    ) => Promise<{ added: number; failed: number }>;
    /** Drop a single queued change by path. */
    removeChange: (filePath: string) => void;
    /**
     * Queue a file deletion. A committed file becomes a pending deletion (a
     * `null` blob hash); a not-yet-staged upload is simply dropped from the
     * queue. Any existing queued change for the path is replaced first.
     */
    deleteFile: (filePath: string, name: string, committed: boolean) => void;
    /**
     * Queue a rename within the same folder, carrying the file's `blobHash` to
     * the new path. A committed original is queued for deletion first, then the
     * new path is queued as an addition (same bytes, new name); a not-yet-staged
     * file simply moves to the new path.
     */
    renameFile: (
        oldPath: string,
        newPath: string,
        blobHash: string,
        size: number,
        committed: boolean,
    ) => void;
    /** Clear the whole queue. */
    clear: () => void;
    /**
     * Commit every queued change in one request. On success returns the staged
     * changes (so the caller can reflect them in the file tree) and empties the
     * queue; on failure returns `null` and leaves the queue intact.
     */
    stage: () => Promise<PendingChange[] | null>;
}

/**
 * Owns the workspace upload flow: the two-step "upload blobs, then stage the
 * tree" contract.
 *
 *  1. `uploadFiles` sends each file's raw bytes to
 *     `POST /api/workspace/blob/:repoId` and queues the returned `blobHash`.
 *  2. `stage` posts the queue as `[{ filePath, blobHash }]` to
 *     `POST /api/workspace/tree/upload/:repoId/:workspaceId`.
 */
export function usePendingChanges(
    repoId: string | undefined,
    workspaceId: string | undefined,
): UsePendingChangesResult {
    const { addToast } = useToast();
    const [changes, setChanges] = useState<PendingChange[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isStaging, setIsStaging] = useState(false);

    const uploadFiles = useCallback(
        async (files: File[], folderPath: string) => {
            if (!repoId || files.length === 0) {
                return { added: 0, failed: 0 };
            }

            setIsUploading(true);
            try {
                const results = await Promise.all(
                    files.map(async (file): Promise<PendingChange | null> => {
                        try {
                            const res = await fetch(
                                `${process.env.NEXT_PUBLIC_API_URL}/api/workspace/blob/${encodeURIComponent(
                                    repoId,
                                )}`,
                                {
                                    method: 'POST',
                                    credentials: 'include',
                                    // The endpoint expects the raw file bytes —
                                    // not multipart, JSON, or base64.
                                    headers: {
                                        'Content-Type': 'application/octet-stream',
                                    },
                                    body: file,
                                },
                            );
                            const body = await res.json().catch(() => null);
                            const blobHash = body?.data?.blobHash;
                            if (!res.ok || !blobHash) return null;

                            const size = body?.data?.size;
                            return {
                                filePath: `${folderPath}${file.name}`,
                                blobHash,
                                name: file.name,
                                size: typeof size === 'number' ? size : file.size,
                            };
                        } catch {
                            return null;
                        }
                    }),
                );

                const uploaded = results.filter(
                    (c): c is PendingChange => c !== null,
                );
                const added = uploaded.length;
                const failed = results.length - added;

                if (added > 0) {
                    setChanges((prev) => {
                        const byPath = new Map(prev.map((c) => [c.filePath, c]));
                        for (const change of uploaded) {
                            byPath.set(change.filePath, change);
                        }
                        return Array.from(byPath.values());
                    });
                    addToast(
                        `${added} file${added === 1 ? '' : 's'} ready to stage.`,
                        'success',
                    );
                }
                if (failed > 0) {
                    addToast(
                        `${failed} file${failed === 1 ? '' : 's'} failed to upload.`,
                        'error',
                    );
                }

                return { added, failed };
            } finally {
                setIsUploading(false);
            }
        },
        [repoId, addToast],
    );

    const removeChange = useCallback((filePath: string) => {
        setChanges((prev) => prev.filter((c) => c.filePath !== filePath));
    }, []);

    const deleteFile = useCallback(
        (filePath: string, name: string, committed: boolean) => {
            setChanges((prev) => {
                // Drop any queued upload for this path first.
                const withoutPath = prev.filter((c) => c.filePath !== filePath);
                // A purely local / not-yet-staged file just disappears; a
                // committed one needs an explicit deletion the backend can apply.
                if (!committed) return withoutPath;
                return [...withoutPath, { filePath, blobHash: null, name, size: 0 }];
            });
        },
        [],
    );

    const renameFile = useCallback(
        (
            oldPath: string,
            newPath: string,
            blobHash: string,
            size: number,
            committed: boolean,
        ) => {
            if (!blobHash || oldPath === newPath) return;
            const nameOf = (p: string) => p.slice(p.lastIndexOf('/') + 1);

            setChanges((prev) => {
                // Drop any queued change for either path before re-queueing.
                const rest = prev.filter(
                    (c) => c.filePath !== oldPath && c.filePath !== newPath,
                );
                const next = [...rest];
                // Order matters: the deletion of the committed original is queued
                // before the addition at the new path. A purely-local file has
                // nothing committed to delete — it just moves.
                if (committed) {
                    next.push({
                        filePath: oldPath,
                        blobHash: null,
                        name: nameOf(oldPath),
                        size: 0,
                    });
                }
                next.push({
                    filePath: newPath,
                    blobHash,
                    name: nameOf(newPath),
                    size,
                });
                return next;
            });
        },
        [],
    );

    const clear = useCallback(() => setChanges([]), []);

    const stage = useCallback(async (): Promise<PendingChange[] | null> => {
        if (!repoId || !workspaceId || changes.length === 0) return null;

        setIsStaging(true);
        try {
            const payload = {
                changes: changes.map((c) => ({
                    filePath: c.filePath,
                    blobHash: c.blobHash,
                })),
            };
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/workspace/tree/upload/${encodeURIComponent(
                    repoId,
                )}/${encodeURIComponent(workspaceId)}`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                },
            );
            const body = await res.json().catch(() => null);

            if (!res.ok) {
                addToast(body?.message ?? 'Could not stage changes.', 'error');
                return null;
            }

            const staged = changes;
            setChanges([]);
            addToast(
                body?.message ??
                    `Staged ${staged.length} change${staged.length === 1 ? '' : 's'}.`,
                'success',
            );
            return staged;
        } catch {
            addToast('Something went wrong while staging. Please try again.', 'error');
            return null;
        } finally {
            setIsStaging(false);
        }
    }, [repoId, workspaceId, changes, addToast]);

    return {
        changes,
        isUploading,
        isStaging,
        uploadFiles,
        removeChange,
        deleteFile,
        renameFile,
        clear,
        stage,
    };
}
