import type { WorkspaceTree, WorkspaceTreeEntry } from '@/types/workspace-tree';

/**
 * Maps a raw tree level from `GET /api/workspace/tree/:repoId/:workspaceId`
 * into the normalised `WorkspaceTree` shape, tolerating both camelCase and
 * snake_case keys so the UI is decoupled from the exact API serialisation.
 */
export function normalizeWorkspaceTree(raw: any): WorkspaceTree {
    const entries = Array.isArray(raw?.entries) ? raw.entries : [];
    return {
        treeHash: raw?.treeHash ?? raw?.tree_hash ?? '',
        entries: entries.map(normalizeEntry),
    };
}

function normalizeEntry(raw: any): WorkspaceTreeEntry {
    return {
        name: raw?.name ?? '',
        type: raw?.type === 'tree' ? 'tree' : 'blob',
        objectHash: raw?.objectHash ?? raw?.object_hash ?? null,
        size: raw?.size ?? null,
        status: raw?.status ?? null,
    };
}
