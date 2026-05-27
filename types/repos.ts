export type RepoRole = 'owner' | 'admin' | 'member';

export type RepoSortField = 'created' | 'updated' | 'name';
export type RepoSortDirection = 'asc' | 'desc';
export type RepoHasCommits = 'true' | 'false';

export interface RepositoryOwner {
    username: string;
    usernameNormalized: string;
    avatarUrl: string | null;
}

export interface Repository {
    id: string;
    name: string;
    description: string | null;
    ownerId: string;
    owner: RepositoryOwner;
    headCommit: string | null;
    createdAt: string;
    updatedAt: string;
    role: RepoRole;
}

export interface RepoListFilters {
    q?: string;
    owner?: string;
    role?: RepoRole;
    created_from?: string;
    created_to?: string;
    has_commits?: RepoHasCommits;
    sort: RepoSortField;
    direction: RepoSortDirection;
    page: number;
    per_page: number;
}

export interface RepoListData {
    items: Repository[];
    page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
}

export interface RepoListResponse {
    status: 'success';
    data: RepoListData;
}
