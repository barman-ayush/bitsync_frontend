export interface Repository {
    id: string;
    name: string;
    owner: string;
    description?: string;
    isPrivate: boolean;
    createdAt: string;
    updatedAt: string;
    filesCount: number;
    contributorsCount: number;
    visibility: 'public' | 'private';
    language?: string;
    starsCount?: number;
    forksCount?: number;
}
