import { useCallback, useEffect, useRef, useState } from 'react';
import { normalizeWorkspaceTree } from '@/lib/normalize-workspace-tree';
import type { WorkspaceTreeEntry } from '@/types/workspace-tree';

export type DirStatus = 'idle' | 'loading' | 'success' | 'error';

export interface WorkspaceDir {
    status: DirStatus;
    entries: WorkspaceTreeEntry[];
    error: string | null;
}

/** Root directory key — the empty path the backend resolves to the head tree. */
export const ROOT_PATH = '';

const EMPTY_DIR: WorkspaceDir = { status: 'idle', entries: [], error: null };

export interface UseWorkspaceTreeResult {
    /** Listing state for a directory path; `idle` if it hasn't been loaded yet. */
    getDir: (path: string) => WorkspaceDir;
    /**
     * Load a directory's children, caching the result by path. No-op if it's
     * already loaded or in flight (pass `force` to re-fetch).
     *
     * Per the backend contract the caller passes the folder entry's
     * `objectHash` as `treeHash`; omit it for newly-added folders, and at the
     * root pass nothing — the backend derives the root tree itself.
     */
    loadDir: (path: string, treeHash?: string | null, force?: boolean) => void;
    /**
     * Insert or replace (by name) an entry inside an already-loaded directory,
     * so freshly-staged files show up without a round trip. No-op if the parent
     * directory hasn't been loaded yet — the backend will include the entry the
     * first time that directory is fetched.
     */
    upsertEntry: (parentPath: string, entry: WorkspaceTreeEntry) => void;
    /**
     * Remove an entry (by name) from an already-loaded directory, so a staged
     * deletion drops out of the listing without a round trip. No-op if the
     * parent directory hasn't been loaded.
     */
    removeEntry: (parentPath: string, name: string) => void;
    /**
     * Mark a directory as loaded-but-empty so expanding a freshly-created local
     * folder (which the backend doesn't know about yet) doesn't trigger a fetch.
     */
    markDirLoaded: (path: string) => void;
}

/**
 * Lazily loads a workspace's file tree one directory at a time via
 * `GET /api/workspace/tree/get/:repoId/:workspaceId?path=<dir>&tree_hash=<hash>`.
 * Each level's listing is cached by its path so re-expanding a folder is
 * instant. The root loads automatically whenever the workspace changes;
 * subfolders load on demand through `loadDir`.
 */
export function useWorkspaceTree(
    repoId: string | undefined,
    workspaceId: string | undefined,
): UseWorkspaceTreeResult {
    const [dirs, setDirs] = useState<Record<string, WorkspaceDir>>({});

    // Track which paths are loaded / in flight so `loadDir` can short-circuit
    // without depending on (and thus churning with) the `dirs` state.
    const loadedRef = useRef<Set<string>>(new Set());
    const loadingRef = useRef<Set<string>>(new Set());
    const controllersRef = useRef<Map<string, AbortController>>(new Map());

    const loadDir = useCallback(
        (path: string, treeHash?: string | null, force = false) => {
            if (!repoId || !workspaceId) return;
            if (!force && (loadingRef.current.has(path) || loadedRef.current.has(path))) {
                return;
            }

            controllersRef.current.get(path)?.abort();
            const controller = new AbortController();
            controllersRef.current.set(path, controller);
            loadingRef.current.add(path);

            setDirs((prev) => ({
                ...prev,
                [path]: {
                    status: 'loading',
                    entries: prev[path]?.entries ?? [],
                    error: null,
                },
            }));

            const params = new URLSearchParams();
            if (path) params.set('path', path);
            if (treeHash) params.set('tree_hash', treeHash);
            const qs = params.toString();

            (async () => {
                try {
                    const res = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/api/workspace/tree/get/${encodeURIComponent(
                            repoId,
                        )}/${encodeURIComponent(workspaceId)}${qs ? `?${qs}` : ''}`,
                        { credentials: 'include', signal: controller.signal },
                    );
                    const body = await res.json().catch(() => null);
                    if (controller.signal.aborted) return;

                    loadingRef.current.delete(path);

                    if (!res.ok || !body?.data) {
                        setDirs((prev) => ({
                            ...prev,
                            [path]: {
                                status: 'error',
                                entries: prev[path]?.entries ?? [],
                                error: body?.message ?? `Request failed with ${res.status}`,
                            },
                        }));
                        return;
                    }

                    const tree = normalizeWorkspaceTree(body.data);
                    loadedRef.current.add(path);
                    setDirs((prev) => ({
                        ...prev,
                        [path]: { status: 'success', entries: tree.entries, error: null },
                    }));
                } catch (e) {
                    if (controller.signal.aborted || (e as Error).name === 'AbortError') {
                        return;
                    }
                    loadingRef.current.delete(path);
                    setDirs((prev) => ({
                        ...prev,
                        [path]: {
                            status: 'error',
                            entries: prev[path]?.entries ?? [],
                            error: (e as Error).message ?? 'Network error',
                        },
                    }));
                }
            })();
        },
        [repoId, workspaceId],
    );

    // Reset all cached levels and reload the root whenever the workspace changes.
    useEffect(() => {
        loadedRef.current = new Set();
        loadingRef.current = new Set();
        controllersRef.current.forEach((c) => c.abort());
        controllersRef.current = new Map();
        setDirs({});

        if (repoId && workspaceId) loadDir(ROOT_PATH);

        return () => {
            controllersRef.current.forEach((c) => c.abort());
        };
    }, [repoId, workspaceId, loadDir]);

    const upsertEntry = useCallback(
        (parentPath: string, entry: WorkspaceTreeEntry) => {
            setDirs((prev) => {
                const existing = prev[parentPath];
                // Only touch directories the user has actually loaded; otherwise
                // the backend's first listing would carry the entry anyway.
                if (!existing || existing.status !== 'success') return prev;
                const rest = existing.entries.filter((e) => e.name !== entry.name);
                return {
                    ...prev,
                    [parentPath]: { ...existing, entries: [...rest, entry] },
                };
            });
        },
        [],
    );

    const removeEntry = useCallback((parentPath: string, name: string) => {
        setDirs((prev) => {
            const existing = prev[parentPath];
            if (!existing || existing.status !== 'success') return prev;
            return {
                ...prev,
                [parentPath]: {
                    ...existing,
                    entries: existing.entries.filter((e) => e.name !== name),
                },
            };
        });
    }, []);

    const markDirLoaded = useCallback((path: string) => {
        loadedRef.current.add(path);
        setDirs((prev) => ({
            ...prev,
            [path]: {
                status: 'success',
                entries: prev[path]?.entries ?? [],
                error: null,
            },
        }));
    }, []);

    const getDir = useCallback(
        (path: string): WorkspaceDir => dirs[path] ?? EMPTY_DIR,
        [dirs],
    );

    return { getDir, loadDir, upsertEntry, removeEntry, markDirLoaded };
}
