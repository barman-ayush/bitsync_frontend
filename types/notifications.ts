/**
 * Known notification types. New types will be added over time, so the union
 * stays open (`string & {}`) — this keeps autocomplete for the known literals
 * while still accepting any future type the API sends.
 */
export type NotificationType =
    | 'repo_invite'
    | 'invite_accepted'
    | 'pr_reverted'
    | (string & {});

export interface NotificationActor {
    email: string;
    displayName: string;
    avatarUrl: string | null;
}

/** Shape of `data` for `repo_invite` notifications. */
export interface RepoInviteData {
    repoId?: string;
    repoName?: string;
    ownerName?: string;
    role?: string;
    inviteId?: string;
}

export interface AppNotification {
    id: string;
    /** Recipient — always the caller. */
    userId: string;
    /** Actor that triggered the event; null for system events. */
    actorId: string | null;
    type: NotificationType;
    title: string;
    body: string | null;
    /** Type-specific payload, e.g. `RepoInviteData` for `repo_invite`. */
    data: Record<string, unknown> | null;
    isRead: boolean;
    /** ISO timestamp, or null when the notification never expires. */
    expiresAt: string | null;
    createdAt: string;
    actor: NotificationActor | null;
}
