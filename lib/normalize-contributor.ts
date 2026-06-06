import type { Contributor, ContributorRole } from '@/types/contributors';

const CONTRIBUTOR_ROLES: ContributorRole[] = ['owner', 'admin', 'member'];

function normalizeRole(role: unknown): ContributorRole {
    if (typeof role === 'string') {
        const lower = role.toLowerCase();
        if ((CONTRIBUTOR_ROLES as string[]).includes(lower)) {
            return lower as ContributorRole;
        }
    }
    return 'member';
}

/**
 * Maps a raw `repoMember` row from `api/repo/:repoId/contributors` into the
 * normalised `Contributor` shape consumed by the Contributors view.
 */
export function normalizeContributor(raw: any): Contributor {
    const user = raw?.user ?? {};

    return {
        id: user.id ?? '',
        name: user.displayName ?? user.username ?? user.email ?? 'Unknown user',
        email: user.email ?? '',
        avatar: user.avatarUrl ?? undefined,
        role: normalizeRole(raw?.role),
        joinedAt: raw?.joinedAt ?? '',
    };
}
