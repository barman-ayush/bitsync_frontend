export interface Workspace {
    id: string;
    name: string;
    repoId: string;
    userId: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
}

/** Cursor-based pagination envelope returned by `GET /api/workspace/get-all/:repoId`. */
export interface WorkspacePagination {
    nextCursor: string | null;
    hasMore: boolean;
}

export interface WorkspaceListResponse {
    status: 'success';
    data: Workspace[];
    pagination: WorkspacePagination;
}
