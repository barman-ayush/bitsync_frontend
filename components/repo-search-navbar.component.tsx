'use client';

import { Button } from '@/components/ui/button';
import { ChevronDown, Filter, Plus, Search, X } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
    describeQualifier,
    parseSearchInput,
    qualifierKey,
    setQualifier,
    type ParsedQualifier,
} from '@/lib/repo-search-parser';
import type { RepoRole, RepoSortDirection, RepoSortField } from '@/types/repos';

interface RepoSearchNavbarProps {
    searchInput: string;
    onSearchInputChange: (value: string) => void;
    onNewRepo?: () => void;
}

const ROLE_OPTIONS: { label: string; value: RepoRole | null }[] = [
    { label: 'Any role', value: null },
    { label: 'Owner', value: 'owner' },
    { label: 'Admin', value: 'admin' },
    { label: 'Member', value: 'member' },
];

const SORT_OPTIONS: { label: string; sort: RepoSortField; direction: RepoSortDirection }[] = [
    { label: 'Recently updated', sort: 'updated', direction: 'desc' },
    { label: 'Oldest update', sort: 'updated', direction: 'asc' },
    { label: 'Recently created', sort: 'created', direction: 'desc' },
    { label: 'Oldest created', sort: 'created', direction: 'asc' },
    { label: 'Name (A-Z)', sort: 'name', direction: 'asc' },
    { label: 'Name (Z-A)', sort: 'name', direction: 'desc' },
];

export function RepoSearchNavbar({
    searchInput,
    onSearchInputChange,
    onNewRepo,
}: RepoSearchNavbarProps) {
    const parsed = parseSearchInput(searchInput);

    const currentRole = findQualifier(parsed.qualifiers, 'role')?.value as RepoRole | undefined;
    const currentHasCommits = findQualifier(parsed.qualifiers, 'has_commits')?.value as
        | 'true'
        | 'false'
        | undefined;
    const currentSort = (findQualifier(parsed.qualifiers, 'sort')?.value as RepoSortField | undefined) ?? 'updated';
    const currentDirection =
        (findQualifier(parsed.qualifiers, 'direction')?.value as RepoSortDirection | undefined) ?? 'desc';

    const sortLabel =
        SORT_OPTIONS.find((o) => o.sort === currentSort && o.direction === currentDirection)?.label ??
        'Recently updated';

    const applyQualifier = (key: string, value: string | null) => {
        onSearchInputChange(setQualifier(searchInput, key, value));
    };

    const removeQualifierByKey = (q: ParsedQualifier) => {
        onSearchInputChange(setQualifier(searchInput, qualifierKey(q), null));
    };

    return (
        <div className="px-6 md:px-12 lg:px-20 pt-6 pb-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-foreground">My Repositories</h1>
                <Button
                    onClick={onNewRepo}
                    className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">New repository</span>
                </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
                <div className="group flex flex-1 items-center gap-2 h-10 rounded-md border border-border bg-card/40 px-3 transition-colors focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20 hover:border-border/80">
                    <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                    <input
                        type="text"
                        placeholder='Find a repository... try owner:alice role:admin description:"docs"'
                        value={searchInput}
                        onChange={(e) => onSearchInputChange(e.target.value)}
                        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none border-0"
                    />
                    {searchInput && (
                        <button
                            type="button"
                            aria-label="Clear search"
                            onClick={() => onSearchInputChange('')}
                            className="shrink-0 rounded-sm p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-10 gap-1.5">
                                <Filter className="h-3.5 w-3.5" />
                                Role{currentRole ? `: ${currentRole}` : ''}
                                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[10rem]">
                            <DropdownMenuLabel>Role</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {ROLE_OPTIONS.map((o) => (
                                <DropdownMenuItem
                                    key={o.label}
                                    onSelect={() => applyQualifier('role', o.value)}
                                    className="cursor-pointer"
                                >
                                    {o.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-10 gap-1.5">
                                Sort: {sortLabel}
                                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[12rem]">
                            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {SORT_OPTIONS.map((o) => (
                                <DropdownMenuItem
                                    key={o.label}
                                    onSelect={() => {
                                        const next = setQualifier(
                                            setQualifier(searchInput, 'sort', o.sort),
                                            'direction',
                                            o.direction,
                                        );
                                        onSearchInputChange(next);
                                    }}
                                    className="cursor-pointer"
                                >
                                    {o.label}
                                </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem
                                checked={currentHasCommits === 'true'}
                                onCheckedChange={(checked) =>
                                    applyQualifier('has_commits', checked ? 'true' : null)
                                }
                            >
                                Only with commits
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={currentHasCommits === 'false'}
                                onCheckedChange={(checked) =>
                                    applyQualifier('has_commits', checked ? 'false' : null)
                                }
                            >
                                Only empty repos
                            </DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {parsed.qualifiers.length > 0 && (
                <ActiveFilterChips qualifiers={parsed.qualifiers} onRemove={removeQualifierByKey} />
            )}
        </div>
    );
}

function findQualifier(qualifiers: ParsedQualifier[], type: ParsedQualifier['type']) {
    return qualifiers.find((q) => q.type === type);
}

function ActiveFilterChips({
    qualifiers,
    onRemove,
}: {
    qualifiers: ParsedQualifier[];
    onRemove: (q: ParsedQualifier) => void;
}) {
    const seen = new Set<string>();
    const unique = qualifiers.filter((q) => {
        const k = qualifierKey(q);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
    });

    return (
        <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Active:</span>
            {unique.map((q) => (
                <button
                    key={`${qualifierKey(q)}-${'value' in q ? q.value : ''}`}
                    type="button"
                    onClick={() => onRemove(q)}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs text-foreground hover:bg-muted transition-colors"
                >
                    {describeQualifier(q)}
                    <X className="h-3 w-3 opacity-70" />
                </button>
            ))}
        </div>
    );
}
