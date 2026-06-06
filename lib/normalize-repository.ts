import type { Repository, RepositoryOwner } from '@/types/repos';

/**
 * Maps a raw repository payload from `api/repo/:username/:reponame` into the
 * normalised `Repository` shape used across the client. Accepts both camelCase
 * and snake_case keys so the UI is decoupled from the exact API serialisation.
 */
export function normalizeRepository(raw: any): Repository {
    const rawOwner = raw?.owner ?? {};

    const owner: RepositoryOwner = {
        username: rawOwner.username ?? '',
        usernameNormalized:
            rawOwner.usernameNormalized ?? rawOwner.username_normalized ?? '',
        avatarUrl: rawOwner.avatarUrl ?? rawOwner.avatar_url ?? null,
    };

    return {
        id: raw?.id ?? '',
        name: raw?.name ?? '',
        description: raw?.description ?? null,
        ownerId: raw?.ownerId ?? raw?.owner_id ?? '',
        owner,
        headCommit: raw?.headCommit ?? raw?.head_commit ?? null,
        createdAt: raw?.createdAt ?? raw?.created_at ?? '',
        updatedAt: raw?.updatedAt ?? raw?.updated_at ?? '',
        role: raw?.role,
    };
}
