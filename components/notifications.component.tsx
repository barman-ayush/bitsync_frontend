'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Bell,
    GitPullRequestArrow,
    UserPlus,
    UserCheck,
    Info,
    Check,
    Loader2,
} from 'lucide-react';
import { useUser } from '@/contexts/user.context';
import { useToast } from '@/components/toast-provider';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetTrigger,
} from '@/components/ui/sheet';
import type { AppNotification, NotificationType } from '@/types/notifications';
import { cn } from '@/lib/utils';

type FetchStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Icon shown for each notification type. Falls back to a generic icon for any
 * type not yet listed here, so new notification types render gracefully.
 */
const typeIcons: Partial<Record<NotificationType, typeof Bell>> = {
    repo_invite: UserPlus,
    invite_accepted: UserCheck,
    pr_reverted: GitPullRequestArrow,
};

function iconForType(type: NotificationType): typeof Bell {
    return typeIcons[type] ?? Info;
}

function formatRelativeTime(iso: string): string {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return '';
    const diffMs = Date.now() - then;
    const minutes = Math.round(diffMs / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString();
}

export function NotificationsButton() {
    const { user } = useUser();
    const { addToast } = useToast();
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [status, setStatus] = useState<FetchStatus>('idle');
    const [actioningId, setActioningId] = useState<string | null>(null);

    const fetchNotifications = useCallback(async (signal?: AbortSignal) => {
        setStatus('loading');
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/notification`,
                { credentials: 'include', signal },
            );
            const body = await res.json().catch(() => null);
            // Expected shape: { status: 'success', data: { notifications: [...] } }
            if (
                !res.ok ||
                body?.status !== 'success' ||
                !Array.isArray(body?.data?.notifications)
            ) {
                setStatus('error');
                return;
            }
            setNotifications(body.data.notifications as AppNotification[]);
            setStatus('success');
        } catch (e) {
            if ((e as Error).name === 'AbortError') return;
            setStatus('error');
        }
    }, []);

    // Load on mount (when authenticated) and refresh whenever the panel opens.
    useEffect(() => {
        if (!user) return;
        const controller = new AbortController();
        fetchNotifications(controller.signal);
        return () => controller.abort();
    }, [user, open, fetchNotifications]);

    const unreadCount = useMemo(
        () => notifications.filter((n) => !n.isRead).length,
        [notifications],
    );

    // Only available to authenticated users.
    if (!user) return null;

    const markAllAsRead = async () => {
        // Optimistic — the unread badge clears immediately.
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/notification/read-all`,
                { method: 'PATCH', credentials: 'include' },
            );
            if (!res.ok) fetchNotifications();
        } catch {
            // Resync with the server so the badge reflects reality.
            fetchNotifications();
        }
    };

    const markAsRead = async (id: string) => {
        // Optimistic — the unread badge updates immediately.
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
        );
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/notification/${id}/read`,
                { method: 'PATCH', credentials: 'include' },
            );
            if (!res.ok) fetchNotifications();
        } catch {
            // Resync with the server so the badge reflects reality.
            fetchNotifications();
        }
    };

    const respondToInvite = async (
        notification: AppNotification,
        action: 'accept' | 'decline',
    ) => {
        if (actioningId) return;
        setActioningId(notification.id);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/repo/invite/${action}`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ notificationId: notification.id }),
                },
            );
            const body = await res.json().catch(() => null);
            if (!res.ok || body?.status !== 'success') {
                addToast(
                    body?.message ?? 'Could not respond to the invitation.',
                    'error',
                );
                // 400/404 mean the invite was consumed server-side (expired or
                // gone) — drop it from the inbox rather than letting the user retry.
                if (res.status === 400 || res.status === 404) {
                    setNotifications((prev) =>
                        prev.filter((n) => n.id !== notification.id),
                    );
                }
                return;
            }
            addToast(
                body?.message ??
                    (action === 'accept' ? 'Invitation accepted.' : 'Invitation declined.'),
                'success',
            );
            // Drop the handled invite from the list.
            setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
        } catch {
            addToast('Something went wrong. Please try again.', 'error');
            // Network failure — keep the invite so the user can retry.
        } finally {
            setActioningId(null);
        }
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <button
                    type="button"
                    aria-label={
                        unreadCount > 0
                            ? `Notifications, ${unreadCount} unread`
                            : 'Notifications'
                    }
                    className="relative h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-primary text-primary-foreground text-[0.625rem] font-semibold flex items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
            </SheetTrigger>

            <SheetContent side="right" className="w-full sm:max-w-md p-0 gap-0">
                <SheetHeader className="border-b border-border">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col gap-1">
                            <SheetTitle>Notifications</SheetTitle>
                            <SheetDescription>
                                {unreadCount > 0
                                    ? `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}.`
                                    : 'You are all caught up.'}
                            </SheetDescription>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={markAllAsRead}
                                className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                            >
                                <Check className="h-3.5 w-3.5" />
                                Mark all read
                            </button>
                        )}
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto no-scrollbar">
                    {status === 'loading' && notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Loading notifications…</p>
                        </div>
                    ) : status === 'error' && notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
                            <Info className="h-8 w-8 text-muted-foreground/60" />
                            <p className="text-sm font-medium text-foreground">
                                Couldn&apos;t load notifications
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchNotifications()}
                                className="mt-1"
                            >
                                Try again
                            </Button>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
                            <Bell className="h-8 w-8 text-muted-foreground/60" />
                            <p className="text-sm font-medium text-foreground">No notifications yet</p>
                            <p className="text-xs text-muted-foreground">
                                We&apos;ll let you know when something needs your attention.
                            </p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-border">
                            {notifications.map((notification) => (
                                <NotificationItem
                                    key={notification.id}
                                    notification={notification}
                                    isActioning={actioningId === notification.id}
                                    disabled={actioningId !== null}
                                    onMarkRead={markAsRead}
                                    onRespondInvite={respondToInvite}
                                />
                            ))}
                        </ul>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

interface NotificationItemProps {
    notification: AppNotification;
    isActioning: boolean;
    disabled: boolean;
    onMarkRead: (id: string) => void;
    onRespondInvite: (
        notification: AppNotification,
        action: 'accept' | 'decline',
    ) => void;
}

function NotificationItem({
    notification,
    isActioning,
    disabled,
    onMarkRead,
    onRespondInvite,
}: NotificationItemProps) {
    const Icon = iconForType(notification.type);
    const isInvite = notification.type === 'repo_invite';

    return (
        <li
            className={cn(
                'transition-colors',
                !notification.isRead && 'bg-primary/[0.03]',
            )}
        >
            <div
                role={notification.isRead ? undefined : 'button'}
                tabIndex={notification.isRead ? undefined : 0}
                onClick={() => !notification.isRead && onMarkRead(notification.id)}
                className={cn(
                    'flex items-start gap-3 px-4 py-3',
                    !notification.isRead && 'cursor-pointer hover:bg-muted/50',
                )}
            >
                <div
                    className={cn(
                        'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full',
                        notification.isRead
                            ? 'bg-muted text-muted-foreground'
                            : 'bg-primary/10 text-primary',
                    )}
                >
                    {notification.actor?.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={notification.actor.avatarUrl}
                            alt={notification.actor.displayName}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <Icon className="h-4 w-4" />
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <p
                            className={cn(
                                'truncate text-sm text-foreground',
                                notification.isRead ? 'font-medium' : 'font-semibold',
                            )}
                        >
                            {notification.title}
                        </p>
                        {!notification.isRead && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                        )}
                    </div>

                    {notification.body && (
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                            {notification.body}
                        </p>
                    )}

                    <p className="mt-1 text-[0.6875rem] text-muted-foreground/80">
                        {notification.actor?.displayName
                            ? `${notification.actor.displayName} · `
                            : ''}
                        {formatRelativeTime(notification.createdAt)}
                    </p>

                    {isInvite && (
                        <div className="mt-2 flex items-center gap-2">
                            <Button
                                size="sm"
                                className="h-7 px-3 text-xs"
                                disabled={disabled}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRespondInvite(notification, 'accept');
                                }}
                            >
                                {isActioning ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    'Accept'
                                )}
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-3 text-xs"
                                disabled={disabled}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRespondInvite(notification, 'decline');
                                }}
                            >
                                Reject
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </li>
    );
}
