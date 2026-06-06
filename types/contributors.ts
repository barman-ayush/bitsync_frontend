export type ContributorRole = 'owner' | 'admin' | 'member';

export interface Contributor {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: ContributorRole;
    joinedAt: string;
    lastActive?: string;
}

export interface InviteUser {
    id: string;
    name: string;
    email: string;
    avatar?: string;
}