export type ContributorRole = 'owner' | 'admin' | 'editor' | 'viewer';

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
