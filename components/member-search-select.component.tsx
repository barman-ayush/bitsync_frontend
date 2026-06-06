'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, X, Search, Shield, Eye, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useUserRepositorySearch, type UserSearchResult } from '@/hooks/use-user-search';

export type MemberRole = 'member' | 'admin';

export interface SelectedMember extends UserSearchResult {
    role: MemberRole;
}

interface MemberSearchSelectProps {
    selectedMembers: SelectedMember[];
    onAdd: (member: UserSearchResult) => void;
    onRemove: (email: string) => void;
    onChangeRole: (email: string, role: MemberRole) => void;
    /** When provided, the search is scoped to a repository (excludes existing members). */
    repoId?: string;
    placeholder?: string;
}

/**
 * Username-based member search and selection. Shared between repository creation
 * and the contributors invite flow so both use identical search logic.
 */
export function MemberSearchSelect({
    selectedMembers,
    onAdd,
    onRemove,
    onChangeRole,
    repoId,
    placeholder = 'Search by username...',
}: MemberSearchSelectProps) {
    const [query, setQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    const { status: searchStatus, results: searchHits } = useUserRepositorySearch(
        query,
        400,
        repoId ?? '',
    );

    const searchResults = useMemo(
        () => searchHits.filter((u) => !selectedMembers.some((s) => s.email === u.email)),
        [searchHits, selectedMembers],
    );

    const handleAdd = (member: UserSearchResult) => {
        onAdd(member);
        setQuery('');
        setShowSuggestions(false);
    };

    return (
        <div className="space-y-4">
            <div className="relative">
                <div className="group flex items-center gap-2 h-10 rounded-md border border-border bg-background px-3 transition-colors focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20">
                    <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                    <input
                        type="text"
                        placeholder={placeholder}
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none border-0"
                    />
                </div>

                {showSuggestions && query.trim() && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md overflow-hidden">
                        {searchStatus === 'searching' && (
                            <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Searching…
                            </div>
                        )}
                        {searchStatus === 'success' && searchResults.length > 0 && (
                            searchResults.map((member) => (
                                <button
                                    key={member.email}
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => handleAdd(member)}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent transition-colors"
                                >
                                    <Avatar className="h-7 w-7">
                                        <AvatarFallback className="text-[11px] bg-primary/20 text-primary">
                                            {member.displayName.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-foreground truncate">
                                            {member.displayName}
                                        </div>
                                        <div className="text-xs text-muted-foreground truncate">
                                            {member.email}
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                        {searchStatus === 'success' && searchResults.length === 0 && (
                            <div className="px-3 py-2 text-xs text-muted-foreground">
                                No users found.
                            </div>
                        )}
                        {searchStatus === 'error' && (
                            <div className="px-3 py-2 text-xs text-destructive">
                                Could not search users. Try again.
                            </div>
                        )}
                        {searchStatus === 'idle' && (
                            <div className="px-3 py-2 text-xs text-muted-foreground">
                                Username can only contain letters, numbers, and hyphens.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {selectedMembers.length > 0 && (
                <ul className="space-y-2">
                    {selectedMembers.map((member) => (
                        <li
                            key={member.email}
                            className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2"
                        >
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs bg-primary/20 text-primary">
                                    {member.displayName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-foreground truncate">
                                    {member.displayName}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                    {member.email}
                                </div>
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className="flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-border bg-card/40 hover:bg-card/70 text-xs font-medium text-foreground transition-colors"
                                    >
                                        {member.role === 'admin' ? (
                                            <Shield className="h-3.5 w-3.5" />
                                        ) : (
                                            <Eye className="h-3.5 w-3.5" />
                                        )}
                                        <span className="capitalize">{member.role}</span>
                                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="z-[9999] min-w-[10rem]">
                                    <DropdownMenuItem onSelect={() => onChangeRole(member.email, 'member')}>
                                        <Eye className="h-4 w-4" />
                                        <div className="flex flex-col">
                                            <span className="text-sm">Member</span>
                                            <span className="text-xs text-muted-foreground">Read-only access</span>
                                        </div>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => onChangeRole(member.email, 'admin')}>
                                        <Shield className="h-4 w-4" />
                                        <div className="flex flex-col">
                                            <span className="text-sm">Admin</span>
                                            <span className="text-xs text-muted-foreground">Full control</span>
                                        </div>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <button
                                type="button"
                                aria-label={`Remove ${member.displayName}`}
                                onClick={() => onRemove(member.email)}
                                className="rounded-sm p-1 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
