'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Contributor, ContributorRole } from '@/types/contributors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    MemberSearchSelect,
    type MemberRole,
    type SelectedMember,
} from '@/components/member-search-select.component';
import type { UserSearchResult } from '@/hooks/use-user-search';
import { useToast } from '@/components/toast-provider';
import { useUser } from '@/contexts/user.context';
import { Loader2, LogOut, Search, UserPlus, X } from 'lucide-react';

interface ContributorsProps {
    contributors: Contributor[];
    repoId?: string;
    /** Called with the updated list after a successful remove/promote/demote. */
    onContributorsChange?: (contributors: Contributor[]) => void;
}

type MemberAction = 'leave' | 'remove' | 'promote' | 'demote';

/** Which action buttons the row for `target` should show, given the caller. */
interface RowActions {
    leave?: boolean;
    promote?: boolean;
    demote?: boolean;
    remove?: boolean;
}

const roleColors: Record<ContributorRole, { bg: string; text: string; icon: string }> = {
    owner: { bg: 'bg-primary/10', text: 'text-primary', icon: '👑' },
    admin: { bg: 'bg-accent/10', text: 'text-accent', icon: '⚙️' },
    member: { bg: 'bg-muted', text: 'text-muted-foreground', icon: '👁️' },
};

/** Sort priority: owner first, then admins, then members. */
const roleWeight: Record<ContributorRole, number> = {
    owner: 0,
    admin: 1,
    member: 2,
};

export function Contributors({ contributors, repoId, onContributorsChange }: ContributorsProps) {
    const { addToast } = useToast();
    const { user } = useUser();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedInvites, setSelectedInvites] = useState<SelectedMember[]>([]);
    const [showInviteForm, setShowInviteForm] = useState(false);
    const [isSendingInvites, setIsSendingInvites] = useState(false);
    const [actioningKey, setActioningKey] = useState<string | null>(null);

    const currentUserId = user?.id;
    const currentRole: ContributorRole =
        contributors.find((c) => c.id === currentUserId)?.role ?? 'member';

    // Current user pinned on top, then owner → admins → members.
    const filteredContributors = contributors
        .filter(
            (contributor) =>
                contributor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                contributor.email.toLowerCase().includes(searchQuery.toLowerCase()),
        )
        .sort((a, b) => {
            if (a.id === currentUserId) return -1;
            if (b.id === currentUserId) return 1;
            if (roleWeight[a.role] !== roleWeight[b.role]) {
                return roleWeight[a.role] - roleWeight[b.role];
            }
            return a.name.localeCompare(b.name);
        });

    /**
     * Role rules (mirrors the API):
     * - Self: only "Leave" (and owners cannot leave).
     * - Owner: promote/demote/remove anyone except themselves.
     * - Admin: promote/remove plain members only (not the owner, not other admins).
     * - Member: no management actions.
     */
    const actionsFor = (target: Contributor): RowActions => {
        if (target.id === currentUserId) {
            return { leave: target.role !== 'owner' };
        }
        if (currentRole === 'owner') {
            if (target.role === 'admin') return { demote: true, remove: true };
            if (target.role === 'member') return { promote: true, remove: true };
            return {};
        }
        if (currentRole === 'admin' && target.role === 'member') {
            return { promote: true, remove: true };
        }
        return {};
    };

    const handleMemberAction = async (action: MemberAction, target: Contributor) => {
        if (actioningKey) return;
        if (!repoId) {
            addToast('Could not perform this action: repository not found.', 'error');
            return;
        }

        const key = `${action}:${target.id}`;
        setActioningKey(key);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/repo/${repoId}/${action}`,
                {
                    method: 'POST',
                    credentials: 'include',
                    ...(action === 'leave'
                        ? {}
                        : {
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ userId: target.id }),
                          }),
                },
            );
            const data = await response.json().catch(() => null);

            if (!response.ok) {
                addToast(data?.message ?? 'Could not perform this action.', 'error');
                return;
            }

            addToast(data?.message ?? 'Done.', 'success');

            if (action === 'leave') {
                router.push('/repositories');
                return;
            }
            if (action === 'remove') {
                onContributorsChange?.(contributors.filter((c) => c.id !== target.id));
            } else {
                const newRole: ContributorRole = action === 'promote' ? 'admin' : 'member';
                onContributorsChange?.(
                    contributors.map((c) =>
                        c.id === target.id ? { ...c, role: newRole } : c,
                    ),
                );
            }
        } catch {
            addToast('Something went wrong. Please try again.', 'error');
        } finally {
            setActioningKey(null);
        }
    };

    const handleAddInvite = (member: UserSearchResult) => {
        setSelectedInvites((prev) => [...prev, { ...member, role: 'member' }]);
    };

    const handleRemoveInvite = (email: string) => {
        setSelectedInvites((prev) => prev.filter((m) => m.email !== email));
    };

    const handleChangeInviteRole = (email: string, role: MemberRole) => {
        setSelectedInvites((prev) =>
            prev.map((m) => (m.email === email ? { ...m, role } : m)),
        );
    };

    const resetInviteForm = () => {
        setSelectedInvites([]);
        setShowInviteForm(false);
    };

    const handleSendInvites = async () => {
        if (selectedInvites.length === 0 || isSendingInvites) return;
        if (!repoId) {
            addToast('Could not send invites: repository not found.', 'error');
            return;
        }

        setIsSendingInvites(true);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/repo/${repoId}/invite`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(
                        selectedInvites.map((m) => ({
                            email: m.email,
                            role: m.role,
                        })),
                    ),
                },
            );
            const data = await response.json().catch(() => null);

            if (!response.ok) {
                addToast(data?.message ?? 'Could not send invites.', 'error');
                return;
            }

            addToast(
                data?.message ??
                    `Invite${selectedInvites.length > 1 ? 's' : ''} sent successfully!`,
                'success',
            );
            resetInviteForm();
        } catch {
            addToast('Something went wrong. Please try again.', 'error');
        } finally {
            setIsSendingInvites(false);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="flex flex-col h-full overflow-auto">
            <div className="flex-1 p-6 sm:p-8">
                <div className="max-w-5xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold">Contributors</h2>
                        <p className="text-muted-foreground">
                            Manage who has access to your repository
                        </p>
                    </div>

                    {/* Invite Section — management is owner/admin only */}
                    {currentRole !== 'member' && (
                    <Card className="p-6 border-border/50">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <UserPlus className="h-5 w-5" />
                                    Invite Collaborators
                                </h3>
                                {!showInviteForm && (
                                    <Button onClick={() => setShowInviteForm(true)} className="gap-2">
                                        <UserPlus className="h-4 w-4" />
                                        Invite
                                    </Button>
                                )}
                            </div>

                            {showInviteForm && (
                                <div className="space-y-4 pt-4 border-t border-border">
                                    <p className="text-xs text-muted-foreground">
                                        Search and invite collaborators by username. You can grant
                                        them member or admin access.
                                    </p>

                                    <MemberSearchSelect
                                        selectedMembers={selectedInvites}
                                        onAdd={handleAddInvite}
                                        onRemove={handleRemoveInvite}
                                        onChangeRole={handleChangeInviteRole}
                                        repoId={repoId}
                                    />

                                    <div className="flex gap-2 justify-end">
                                        <Button
                                            variant="outline"
                                            onClick={resetInviteForm}
                                            disabled={isSendingInvites}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleSendInvites}
                                            disabled={selectedInvites.length === 0 || isSendingInvites}
                                        >
                                            {isSendingInvites && (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            )}
                                            {isSendingInvites
                                                ? 'Sending…'
                                                : `Send Invite${selectedInvites.length > 1 ? 's' : ''}`}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                    )}

                    {/* Current Contributors Section */}
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Current Contributors ({contributors.length})</h3>

                            {/* Search bar */}
                            <div className="relative mb-6">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Search by name or email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 bg-card border-border"
                                />
                            </div>
                        </div>

                        {/* Contributors List */}
                        <div className="space-y-3">
                            {filteredContributors.length > 0 ? (
                                filteredContributors.map((contributor) => {
                                    const roleStyle = roleColors[contributor.role];
                                    const isSelf = contributor.id === currentUserId;
                                    const actions = actionsFor(contributor);
                                    const isActioning = (action: MemberAction) =>
                                        actioningKey === `${action}:${contributor.id}`;
                                    return (
                                        <div
                                            key={contributor.id}
                                            className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition group"
                                        >
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <Avatar>
                                                    <AvatarImage src={contributor.avatar} alt={contributor.name} />
                                                    <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                                                        {getInitials(contributor.name)}
                                                    </AvatarFallback>
                                                </Avatar>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h4 className="font-medium text-foreground">
                                                            {contributor.name}
                                                            {isSelf && (
                                                                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                                                                    (you)
                                                                </span>
                                                            )}
                                                        </h4>
                                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${roleStyle.bg} ${roleStyle.text}`}>
                                                            {roleStyle.icon} {contributor.role.charAt(0).toUpperCase() + contributor.role.slice(1)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground truncate">{contributor.email}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Joined {new Date(contributor.joinedAt).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric',
                                                        })}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                                                {actions.leave && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        disabled={actioningKey !== null}
                                                        onClick={() => handleMemberAction('leave', contributor)}
                                                    >
                                                        {isActioning('leave') ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <LogOut className="h-4 w-4" />
                                                        )}
                                                        Leave
                                                    </Button>
                                                )}
                                                {actions.promote && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled={actioningKey !== null}
                                                        onClick={() => handleMemberAction('promote', contributor)}
                                                    >
                                                        {isActioning('promote') ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            'Make Admin'
                                                        )}
                                                    </Button>
                                                )}
                                                {actions.demote && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled={actioningKey !== null}
                                                        onClick={() => handleMemberAction('demote', contributor)}
                                                    >
                                                        {isActioning('demote') ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            'Make Member'
                                                        )}
                                                    </Button>
                                                )}
                                                {actions.remove && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        aria-label={`Remove ${contributor.name}`}
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        disabled={actioningKey !== null}
                                                        onClick={() => handleMemberAction('remove', contributor)}
                                                    >
                                                        {isActioning('remove') ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <X className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="flex items-center justify-center p-8 rounded-lg border border-border/50 text-muted-foreground">
                                    {searchQuery ? 'No contributors match your search' : 'No contributors yet'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}