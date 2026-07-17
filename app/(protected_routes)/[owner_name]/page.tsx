'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Mail, Calendar, Search } from 'lucide-react';
import { useUser } from '@/contexts/user.context';
import { useToast } from '@/components/toast-provider';
import Link from 'next/link';

interface User {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
    username: string;
}

interface Repository {
    id: string;
    name: string;
    nameNormalized: string;
    description: string | null;
    ownerId: string;
    headCommit: string | null;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function ProfilePage() {
    const params = useParams();
    const router = useRouter();
    const username = params.owner_name as string;

    const { user: currentUser, setUser: setCurrentUser } = useUser();
    const { addToast } = useToast();

    const [user, setUser] = useState<User | null>(null);
    const [repositories, setRepositories] = useState<Repository[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Profile editing states
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editDisplayName, setEditDisplayName] = useState('');
    const [editAvatarBase64, setEditAvatarBase64] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (!username) return;

        let isMounted = true;
        const controller = new AbortController();

        async function fetchProfile() {
            setIsLoading(true);
            setError(null);
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/user/${encodeURIComponent(username)}`,
                    { credentials: 'include', signal: controller.signal }
                );

                if (!res.ok) {
                    const body = await res.json().catch(() => null);
                    throw new Error(body?.message ?? `Failed to fetch profile (Status: ${res.status})`);
                }

                const json = await res.json();
                if (isMounted) {
                    setUser(json.data.user);
                    setRepositories(json.data.repositories ?? []);
                }
            } catch (err: any) {
                if (controller.signal.aborted) return;
                if (isMounted) {
                    setError(err.message ?? 'Failed to load user profile');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        fetchProfile();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [username]);

    const isCurrentUser = currentUser?.email === user?.email;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            addToast('Image size must be less than 2MB', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setEditAvatarBase64(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editDisplayName.trim() && !editAvatarBase64) {
            addToast('Please provide a new display name or choose a profile image', 'error');
            return;
        }

        setIsUpdating(true);
        try {
            const body: any = {};
            if (editDisplayName.trim() && editDisplayName.trim() !== user?.displayName) {
                body.newDisplayName = editDisplayName.trim();
            }
            if (editAvatarBase64) {
                body.avatarBlob = editAvatarBase64;
            }

            if (Object.keys(body).length === 0) {
                setIsEditOpen(false);
                setIsUpdating(false);
                return;
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/update`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
                credentials: 'include',
            });

            const json = await res.json().catch(() => null);
            if (!res.ok) {
                throw new Error(json?.message ?? `Update failed with status ${res.status}`);
            }

            const updatedUser = json.data;

            setUser(prev => prev ? {
                ...prev,
                displayName: updatedUser.displayName,
                avatarUrl: updatedUser.avatarUrl,
            } : null);

            if (currentUser) {
                setCurrentUser({
                    ...currentUser,
                    displayName: updatedUser.displayName,
                    avatarUrl: updatedUser.avatarUrl,
                });
            }

            addToast('Profile updated successfully!', 'success');
            setIsEditOpen(false);
            setEditAvatarBase64(null);
        } catch (err: any) {
            addToast(err.message ?? 'Failed to update profile', 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-full w-full flex-col items-center justify-center bg-background min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Loading profile...</p>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="flex flex-col h-full w-full items-center justify-center bg-background min-h-[400px] gap-4 p-4 text-center">
                <p className="text-muted-foreground max-w-md">{error ?? 'User profile not found.'}</p>
                <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    const filteredRepos = repositories.filter(repo =>
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const getInitials = (name: string) => {
        return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
    };

    return (
        <div className="flex flex-col h-full bg-background overflow-y-auto">
            <div className="max-w-6xl w-full mx-auto px-4 md:px-8 py-12 flex flex-col md:flex-row gap-8">
                {/* Left Column: User Details */}
                <div className="w-full md:w-72 shrink-0 space-y-6">
                    <div className="flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-6">
                        <Avatar className="h-24 w-24 md:h-64 md:w-64 border border-border shadow-sm">
                            <AvatarImage src={user.avatarUrl ?? undefined} alt={user.displayName} />
                            <AvatarFallback className="text-2xl md:text-5xl bg-gradient-to-br from-blue-600/20 to-indigo-600/30 text-primary font-bold">
                                {getInitials(user.displayName)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                            <h2 className="text-2xl font-bold text-foreground leading-tight tracking-tight">{user.displayName}</h2>
                            <p className="text-lg text-muted-foreground font-light">@{user.username}</p>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-border/50 text-sm">
                        <div className="flex items-center gap-3 text-muted-foreground">
                            <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="truncate hover:text-foreground cursor-pointer" title={user.email}>{user.email}</span>
                        </div>
                    </div>

                    {isCurrentUser && (
                        <div className="pt-2">
                            <Button 
                                variant="outline" 
                                className="w-full text-xs font-semibold"
                                onClick={() => {
                                    setEditDisplayName(user.displayName);
                                    setEditAvatarBase64(null);
                                    setIsEditOpen(true);
                                }}
                            >
                                Edit profile
                            </Button>
                        </div>
                    )}
                </div>

                {/* Right Column: Repositories List */}
                <div className="flex-1 space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between border-b pb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Find a repository..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 w-full bg-background border-border/80"
                            />
                        </div>
                    </div>

                    {filteredRepos.length === 0 ? (
                        <div className="text-center py-16 border border-dashed rounded-xl text-muted-foreground text-sm">
                            {user.displayName} doesn’t have any public repositories matching your search.
                        </div>
                    ) : (
                        <div className="divide-y divide-border border-t border-border/40">
                            {filteredRepos.map((repo) => (
                                <div key={repo.id} className="py-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div className="space-y-2 max-w-xl">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Link
                                                href={`/${user.username}/${repo.name}`}
                                                className="text-xl font-bold text-blue-500 hover:underline hover:text-blue-600 transition"
                                            >
                                                {repo.name}
                                            </Link>
                                            <span className="text-[11px] font-semibold text-muted-foreground px-2 py-0.5 rounded-full border border-border/60 bg-muted/30">
                                                Public
                                            </span>
                                        </div>
                                        {repo.description ? (
                                            <p className="text-sm text-muted-foreground leading-relaxed break-words">
                                                {repo.description}
                                            </p>
                                        ) : null}
                                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1.5">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3.5 w-3.5" />
                                                <span>Updated {new Date(repo.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Profile Dialog */}
            {isEditOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card border border-border w-full max-w-md rounded-xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h3 className="text-lg font-bold text-foreground">Edit Profile</h3>
                            <button 
                                onClick={() => setIsEditOpen(false)}
                                className="text-muted-foreground hover:text-foreground transition-colors text-sm font-semibold"
                            >
                                Cancel
                            </button>
                        </div>
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-foreground">Display Name</label>
                                <Input 
                                    value={editDisplayName}
                                    onChange={(e) => setEditDisplayName(e.target.value)}
                                    placeholder="Enter display name"
                                    maxLength={100}
                                    disabled={isUpdating}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-foreground block">Profile Picture</label>
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-16 w-16 border">
                                        <AvatarImage src={editAvatarBase64 ?? user.avatarUrl ?? undefined} />
                                        <AvatarFallback className="text-lg bg-muted text-foreground">
                                            {getInitials(editDisplayName || user.displayName)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <input 
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            disabled={isUpdating}
                                            className="text-xs text-muted-foreground file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer w-full"
                                        />
                                        <p className="text-[10px] text-muted-foreground mt-1">Accepts JPG, PNG, WebP. Max 2MB.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-2 border-t pt-4">
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    onClick={() => setIsEditOpen(false)}
                                    disabled={isUpdating}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    className="bg-primary text-primary-foreground gap-2"
                                    disabled={isUpdating}
                                >
                                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
