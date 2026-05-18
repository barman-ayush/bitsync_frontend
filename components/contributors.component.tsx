'use client';

import { useState } from 'react';
import { Contributor, ContributorRole } from '@/types/contributors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Search, UserPlus, X, Shield, Zap } from 'lucide-react';

interface ContributorsProps {
    contributors: Contributor[];
}

const roleColors: Record<ContributorRole, { bg: string; text: string; icon: string }> = {
    owner: { bg: 'bg-primary/10', text: 'text-primary', icon: '👑' },
    admin: { bg: 'bg-accent/10', text: 'text-accent', icon: '⚙️' },
    editor: { bg: 'bg-secondary/10', text: 'text-secondary', icon: '✏️' },
    viewer: { bg: 'bg-muted', text: 'text-muted-foreground', icon: '👁️' },
};

const roleDescriptions: Record<ContributorRole, string> = {
    owner: 'Full control over the repository',
    admin: 'Can manage contributors and settings',
    editor: 'Can edit and upload files',
    viewer: 'Can only view files',
};

export function Contributors({ contributors }: ContributorsProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<ContributorRole>('editor');
    const [showInviteForm, setShowInviteForm] = useState(false);

    const filteredContributors = contributors.filter((contributor) =>
        contributor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contributor.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleInvite = () => {
        if (inviteEmail.trim()) {
            // TODO: Add API call to invite user
            console.log(`Inviting ${inviteEmail} as ${inviteRole}`);
            setInviteEmail('');
            setInviteRole('editor');
            setShowInviteForm(false);
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

                    {/* Invite Section */}
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
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium mb-2">Email Address</label>
                                            <Input
                                                type="email"
                                                placeholder="user@example.com"
                                                value={inviteEmail}
                                                onChange={(e) => setInviteEmail(e.target.value)}
                                                className="bg-card border-border"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Role</label>
                                            <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as ContributorRole)}>
                                                <SelectTrigger className="bg-card border-border">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="viewer">Viewer</SelectItem>
                                                    <SelectItem value="editor">Editor</SelectItem>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                                        <p className="font-medium mb-2">Selected role: {inviteRole}</p>
                                        <p>{roleDescriptions[inviteRole]}</p>
                                    </div>

                                    <div className="flex gap-2 justify-end">
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setShowInviteForm(false);
                                                setInviteEmail('');
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button onClick={handleInvite} disabled={!inviteEmail.trim()}>
                                            Send Invite
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

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
                                                        <h4 className="font-medium text-foreground">{contributor.name}</h4>
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
                                                <Button variant="ghost" size="sm">
                                                    Change Role
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
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