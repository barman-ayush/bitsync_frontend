import type { Workspace } from '@/types/workspaces';

/**
 * Maps a raw workspace row from `api/workspace/get-all/:repoId` into the
 * normalised `Workspace` shape. Accepts both camelCase and snake_case keys so
 * the UI is decoupled from the exact API serialisation.
 */
export function normalizeWorkspace(raw: any): Workspace {
    return {
        id: raw?.id ?? '',
        name: raw?.name ?? 'Untitled workspace',
        repoId: raw?.repoId ?? raw?.repo_id ?? '',
        userId: raw?.userId ?? raw?.user_id ?? '',
        description: raw?.description ?? null,
        createdAt: raw?.createdAt ?? raw?.created_at ?? '',
        updatedAt: raw?.updatedAt ?? raw?.updated_at ?? '',
    };
}
