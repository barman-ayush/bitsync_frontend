export interface CommitAuthor {
    name: string;
    email: string;
}

/** A single entry in a workspace's commit history. */
export interface CommitSummary {
    /** 64-char sha256 of the commit. */
    hash: string;
    /** Full commit message; the first line is treated as the title. */
    message: string;
    /** Who authored the commit (parsed from the stored "Name <email>"). */
    author: CommitAuthor;
    /** ISO timestamp the commit was created. */
    createdAt: string;
    /** Parent commit hash; `null` for the first commit. */
    parent: string | null;
    /** Root tree hash this commit points at. */
    rootTree: string;
}
