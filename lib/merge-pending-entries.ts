import type { PendingChange, WorkspaceTreeEntry } from '@/types/workspace-tree';

export interface DisplayTreeEntry extends WorkspaceTreeEntry {
    /** True when this entry comes from an unstaged upload (not yet committed). */
    pending: boolean;
}

/** The parent directory (trailing slash, or `''` for root) of a full path. */
function parentOf(path: string): string {
    const idx = path.lastIndexOf('/');
    return idx === -1 ? '' : path.slice(0, idx + 1);
}

/**
 * Overlays unstaged uploads onto a directory's committed entries so queued files
 * show up in listings before they're staged. A pending upload that shares a name
 * with an existing file marks it MODIFIED; otherwise it's a new ADDED entry.
 * Results come back folders-first, then alphabetical — matching the tree.
 */
export function mergePendingEntries(
    entries: WorkspaceTreeEntry[],
    pendingChanges: PendingChange[],
    dirPath: string,
): DisplayTreeEntry[] {
    const inDir = pendingChanges.filter((c) => parentOf(c.filePath) === dirPath);
    const pendingForDir = inDir.filter((c) => c.blobHash !== null);
    const pendingByName = new Map(pendingForDir.map((c) => [c.name, c]));
    // Queued deletions (null blob hash) flag their committed entry as DELETED.
    const deletedNames = new Set(
        inDir.filter((c) => c.blobHash === null).map((c) => c.name),
    );

    const merged: DisplayTreeEntry[] = entries.map((entry) => {
        if (entry.type === 'blob' && deletedNames.has(entry.name)) {
            return { ...entry, status: 'DELETED', pending: true };
        }
        const p = entry.type === 'blob' ? pendingByName.get(entry.name) : undefined;
        if (!p) return { ...entry, pending: false };
        return {
            ...entry,
            objectHash: p.blobHash,
            size: p.size,
            status: 'MODIFIED',
            pending: true,
        };
    });

    for (const p of pendingForDir) {
        if (!entries.some((e) => e.name === p.name)) {
            merged.push({
                name: p.name,
                type: 'blob',
                objectHash: p.blobHash,
                size: p.size,
                status: 'ADDED',
                pending: true,
            });
        }
    }

    return merged.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'tree' ? -1 : 1;
        return a.name.localeCompare(b.name);
    });
}
