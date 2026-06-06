'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useUser } from '@/contexts/user.context';
import { useToast } from '@/components/toast-provider';
import { useRepoNameAvailability } from '@/hooks/use-repo-name-availability';
import type { UserSearchResult } from '@/hooks/use-user-search';
import {
    MemberSearchSelect,
    type MemberRole,
    type SelectedMember,
} from '@/components/member-search-select.component';

const NAME_SUGGESTIONS = ['animated-spoon', 'curly-broccoli', 'silver-meteor', 'velvet-falcon', 'glowing-pixel'];

export default function CreateRepositoryPage() {
    const { user } = useUser();
    const router = useRouter();
    const { addToast } = useToast();

    const [repoName, setRepoName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<SelectedMember[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const suggestion = useMemo(() => NAME_SUGGESTIONS[0], []);
    const ownerName = user?.displayName ?? 'you';
    const ownerInitial = ownerName.charAt(0).toUpperCase();

    const { status: nameStatus, debouncedRepoName } = useRepoNameAvailability(repoName);
    const showNameIndicator = repoName.trim().length > 0;
    const showNameMessage = showNameIndicator && nameStatus !== 'idle';

    const handleAddMember = (member: UserSearchResult) => {
        setSelectedMembers((prev) => [...prev, { ...member, role: 'member' }]);
    };

    const handleRemoveMember = (email: string) => {
        setSelectedMembers((prev) => prev.filter((m) => m.email !== email));
    };

    const handleChangeRole = (email: string, role: MemberRole) => {
        setSelectedMembers((prev) =>
            prev.map((m) => (m.email === email ? { ...m, role } : m)),
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/repo/create`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        name: repoName.trim(),
                        description: description.trim(),
                        users: selectedMembers.map((m) => ({
                            email: m.email,
                            role: m.role,
                        })),
                    }),
                },
            );
            const data = await response.json().catch(() => null);

            if (!response.ok) {
                addToast(
                    data?.message ?? 'Could not create repository.',
                    'error',
                );
                return;
            }

            router.push(
                `/repositories?toast="${data?.message ?? 'Repository created successfully!'}"&toastType="success"`,
            );
        } catch {
            addToast('Something went wrong. Please try again.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const charCount = description.length;
    const isValid =
        repoName.trim().length > 0 &&
        nameStatus !== 'taken' &&
        nameStatus !== 'checking' &&
        !isSubmitting;

    return (
        <div className="h-full overflow-auto bg-background">
            <form
                onSubmit={handleSubmit}
                className="mx-auto max-w-3xl px-6 md:px-10 py-10 space-y-8"
            >
                <header className="space-y-2">
                    <h1 className="text-2xl font-bold text-foreground">Create a new repository</h1>
                    <p className="text-sm text-muted-foreground">
                        Repositories contain a project's files and version history.
                    </p>
                    <p className="text-xs italic text-muted-foreground">
                        Required fields are marked with an asterisk (*).
                    </p>
                </header>

                <div className="relative">
                    <div
                        className="pointer-events-none absolute left-[11px] top-6 bottom-6 w-px bg-border"
                        aria-hidden
                    />

                    {/* Step 1: General */}
                    <section className="relative grid grid-cols-[1.5rem_1fr] gap-x-5 pb-10">
                        <div className="relative z-10 h-6 w-6 rounded-full border border-border bg-card flex items-center justify-center text-xs font-medium text-muted-foreground">
                            1
                        </div>

                        <div className="space-y-6 min-w-0">
                            <h2 className="text-base font-semibold text-foreground pt-0.5">General</h2>

                            <div className="flex items-end gap-2 flex-wrap">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-foreground">
                                        Owner <span className="text-destructive">*</span>
                                    </label>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button
                                                type="button"
                                                className="flex items-center gap-2 h-9 px-2.5 rounded-md border border-border bg-card/40 hover:bg-card/70 transition-colors"
                                            >
                                                <Avatar className="h-5 w-5">
                                                    {user?.avatarUrl && (
                                                        <AvatarImage src={user.avatarUrl} alt={ownerName} />
                                                    )}
                                                    <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                                                        {ownerInitial}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm font-medium text-foreground">{ownerName}</span>
                                                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="z-[9999] min-w-[12rem]">
                                            <DropdownMenuItem disabled>
                                                <Avatar className="h-5 w-5">
                                                    {user?.avatarUrl && (
                                                        <AvatarImage src={user.avatarUrl} alt={ownerName} />
                                                    )}
                                                    <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                                                        {ownerInitial}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span>{ownerName}</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <span className="pb-2 text-lg text-muted-foreground">/</span>

                                <div className="flex-1 min-w-[200px] space-y-1.5">
                                    <label
                                        htmlFor="repo-name"
                                        className="text-sm font-semibold text-foreground"
                                    >
                                        Repository name <span className="text-destructive">*</span>
                                    </label>
                                    <div className="relative">
                                        <Input
                                            id="repo-name"
                                            value={repoName}
                                            onChange={(e) => setRepoName(e.target.value)}
                                            autoComplete="off"
                                            className={showNameIndicator ? 'pr-10' : undefined}
                                        />
                                        {showNameIndicator && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity duration-200">
                                                {nameStatus === 'checking' && (
                                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                )}
                                                {nameStatus === 'available' && (
                                                    <CheckCircle2 className="h-4 w-4 text-accent" />
                                                )}
                                                {nameStatus === 'taken' && (
                                                    <XCircle className="h-4 w-4 text-destructive" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div
                                className={`grid transition-all duration-300 ease-out -mt-3 ${showNameMessage ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                                    }`}
                            >
                                <div className="overflow-hidden">
                                    {nameStatus === 'checking' && (
                                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            Checking availability…
                                        </p>
                                    )}
                                    {nameStatus === 'available' && (
                                        <p className="text-sm text-accent flex items-center gap-1.5 font-medium">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            <span className="font-mono">{debouncedRepoName}</span> is available
                                        </p>
                                    )}
                                    {nameStatus === 'taken' && (
                                        <p className="text-sm text-destructive flex items-center gap-1.5">
                                            <XCircle className="h-3.5 w-3.5" />
                                            <span className="font-mono">{debouncedRepoName}</span> already exists under{' '}
                                            <span className="font-mono">{ownerName}</span> as owner
                                        </p>
                                    )}
                                    {nameStatus === 'error' && (
                                        <p className="text-sm text-muted-foreground">
                                            Could not check availability.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Great repository names are short and memorable. How about{' '}
                                <button
                                    type="button"
                                    onClick={() => setRepoName(suggestion)}
                                    className="text-primary hover:underline"
                                >
                                    {suggestion}
                                </button>
                                ?
                            </p>

                            <div className="space-y-1.5">
                                <label
                                    htmlFor="repo-description"
                                    className="text-sm font-semibold text-foreground"
                                >
                                    Description
                                </label>
                                <Input
                                    id="repo-description"
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(e.target.value.slice(0, 350))
                                    }
                                    autoComplete="off"
                                />
                                <p className="text-xs text-muted-foreground">
                                    {charCount} / 350 characters
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Step 2: Configuration (Add members only for now) */}
                    <section className="relative grid grid-cols-[1.5rem_1fr] gap-x-5">
                        <div className="relative z-10 h-6 w-6 rounded-full border border-border bg-card flex items-center justify-center text-xs font-medium text-muted-foreground">
                            2
                        </div>

                        <div className="space-y-4 min-w-0">
                            <h2 className="text-base font-semibold text-foreground pt-0.5">
                                Configuration
                            </h2>

                            <div className="rounded-lg border border-border bg-card/40 p-5 space-y-4">
                                <div className="space-y-1">
                                    <h3 className="text-sm font-semibold text-foreground">Add members</h3>
                                    <p className="text-xs text-muted-foreground">
                                        Search and invite collaborators by username. You can grant them
                                        viewer or admin access.
                                    </p>
                                </div>

                                <MemberSearchSelect
                                    selectedMembers={selectedMembers}
                                    onAdd={handleAddMember}
                                    onRemove={handleRemoveMember}
                                    onChangeRole={handleChangeRole}
                                />
                            </div>
                        </div>
                    </section>
                </div>

                <div className="flex justify-end pt-2">
                    <Button
                        type="submit"
                        disabled={!isValid}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            'Create repository'
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
