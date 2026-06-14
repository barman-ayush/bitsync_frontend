export type WorkspaceEntryType = 'tree' | 'blob';

/**
 * Per-entry diff status relative to the workspace's head commit. The backend
 * may grow new states over time, so this is an open string union.
 */
export type WorkspaceEntryStatus =
    | 'UNMODIFIED'
    | 'MODIFIED'
    | 'ADDED'
    | 'DELETED'
    | 'SUBTREE_MODIFIED'
    | (string & {});

export interface WorkspaceTreeEntry {
    name: string;
    type: WorkspaceEntryType;
    /**
     * Committed object hash, used as the `tree_hash` when drilling into a
     * subfolder. `null` for newly-added entries that aren't committed yet.
     */
    objectHash: string | null;
    size?: number | null;
    status?: WorkspaceEntryStatus | null;
}

/** One directory level returned by `GET /api/workspace/tree/:repoId/:workspaceId`. */
export interface WorkspaceTree {
    treeHash: string;
    entries: WorkspaceTreeEntry[];
}

/** A blob the user has opened, carrying the full path needed to render it. */
export interface SelectedWorkspaceFile {
    name: string;
    /** Full path from the repo root, e.g. `src/utils/parser.py`. */
    path: string;
    objectHash: string | null;
    size?: number | null;
    status?: WorkspaceEntryStatus | null;
}

/**
 * What the file-view pane is currently showing: either a directory listing
 * (GitHub-style folder browse) or a single opened file.
 */
export type WorkspaceSelection =
    | { type: 'dir'; path: string }
    | { type: 'file'; file: SelectedWorkspaceFile };

/**
 * A not-yet-staged change queued in the workspace view. Uploads carry the
 * `blobHash` returned by `POST /api/workspace/blob/:repoId`; a `null` hash marks
 * a deletion. The whole queue is committed in one shot via
 * `POST /api/workspace/tree/upload/:repoId/:workspaceId`.
 */
export interface PendingChange {
    /** Full path from the repo root, e.g. `src/utils/parser.py`. */
    filePath: string;
    /** Blob hash for an add/modify; `null` for a deletion. */
    blobHash: string | null;
    /** File name (last path segment), for display. */
    name: string;
    /** Byte size reported by the blob endpoint. */
    size: number;
}
