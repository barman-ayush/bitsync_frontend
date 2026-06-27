'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronsUpDown, GitBranch, Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { CreateWorkspaceDialog } from '@/components/create-workspace-dialog.component';
import { useWorkspaces } from '@/hooks/use-workspaces';
import type { Workspace } from '@/types/workspaces';
import { cn } from '@/lib/utils';

interface WorkspaceSwitcherProps {
    repoId: string | undefined;
    currentWorkspaceId?: string;
    onSelect: (workspace: Workspace) => void;
}

/**
 * The top section of the workspace sidebar: shows the active workspace and, on
 * click, opens a dropdown listing every workspace in the repo. The list is
 * loaded a page at a time and pulls the next page in as the user scrolls to the
 * bottom (cursor-based infinite scroll), so a repo with thousands of workspaces
 * never blocks on a single huge request.
 */
export function WorkspaceSwitcher({
    repoId,
    currentWorkspaceId,
    onSelect,
}: WorkspaceSwitcherProps) {
    const [open, setOpen] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const { workspaces, status, error, hasMore, loadMore, prependWorkspace } =
        useWorkspaces(repoId);

    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const scrollRef = useRef<HTMLDivElement | null>(null);

    const current =
        workspaces.find((w) => w.id === currentWorkspaceId) ?? workspaces[0] ?? null;

    // Surface the resolved workspace to the parent whenever it changes. This
    // covers a cold load where the URL's `currentWorkspaceId` already matches a
    // workspace (the parent still needs the full object) as well as falling back
    // to the first workspace when the URL names none / an unknown one.
    useEffect(() => {
        if (current) onSelect(current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current?.id]);

    // Watch a sentinel at the bottom of the scroll list; when it scrolls into
    // view and more pages remain, request the next page.
    useEffect(() => {
        if (!open) return;
        const sentinel = sentinelRef.current;
        const root = scrollRef.current;
        if (!sentinel || !root) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting && hasMore) loadMore();
            },
            { root, rootMargin: '120px' },
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [open, hasMore, loadMore, workspaces.length]);

    const handleSelect = (workspace: Workspace) => {
        setOpen(false);
        onSelect(workspace);
    };

    // A freshly-created workspace is shown at the top of the list immediately
    // and becomes the active one, so the rest of the view follows along.
    const handleCreated = (workspace: Workspace) => {
        prependWorkspace(workspace);
        onSelect(workspace);
    };

    return (
        <div className="p-3 border-b border-border">
            <span className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Workspace
            </span>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        aria-label="Switch workspace"
                        className="mt-1.5 flex w-full items-center gap-2 rounded-md border border-border bg-card px-2.5 py-2 text-left transition hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary/15 text-primary">
                            <GitBranch className="h-4 w-4" />
                        </div>
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-foreground">
                                {current?.name ??
                                    (status === 'loading' ? 'Loading…' : 'No workspace')}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                                {workspaces.length > 0
                                    ? `${workspaces.length}${hasMore ? '+' : ''} workspace${
                                          workspaces.length === 1 ? '' : 's'
                                      }`
                                    : 'Switch workspace'}
                            </span>
                        </span>
                        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                </PopoverTrigger>

                <PopoverContent
                    align="start"
                    sideOffset={6}
                    className="w-[var(--radix-popover-trigger-width)] min-w-64 p-0"
                >
                    <div
                        ref={scrollRef}
                        className="max-h-72 overflow-y-auto p-1"
                        role="listbox"
                        aria-label="Workspaces"
                    >
                        {status === 'loading' && (
                            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                                <Spinner className="h-4 w-4" />
                                Loading workspaces…
                            </div>
                        )}

                        {status === 'error' && workspaces.length === 0 && (
                            <div className="px-3 py-6 text-center text-sm text-destructive">
                                {error ?? 'Could not load workspaces'}
                            </div>
                        )}

                        {status !== 'loading' && workspaces.length === 0 && !error && (
                            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                                No workspaces yet
                            </div>
                        )}

                        {workspaces.map((workspace) => {
                            const isActive = workspace.id === current?.id;
                            return (
                                <button
                                    key={workspace.id}
                                    type="button"
                                    role="option"
                                    aria-selected={isActive}
                                    onClick={() => handleSelect(workspace)}
                                    className={cn(
                                        'flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-left text-sm transition hover:bg-muted',
                                        isActive && 'bg-muted/70',
                                    )}
                                >
                                    <GitBranch className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                                        {workspace.name}
                                    </span>
                                    {isActive && (
                                        <Check className="h-4 w-4 shrink-0 text-primary" />
                                    )}
                                </button>
                            );
                        })}

                        {/* Infinite-scroll sentinel + bottom loading indicator. */}
                        {hasMore && (
                            <div
                                ref={sentinelRef}
                                className="flex items-center justify-center py-3 text-xs text-muted-foreground"
                            >
                                {status === 'loadingMore' ? (
                                    <span className="flex items-center gap-2">
                                        <Spinner className="h-3.5 w-3.5" />
                                        Loading more…
                                    </span>
                                ) : (
                                    <span className="h-1 w-1" />
                                )}
                            </div>
                        )}
                    </div>

                    <div className="border-t border-border p-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start gap-2"
                            disabled={!repoId}
                            onClick={() => {
                                setOpen(false);
                                setCreateOpen(true);
                            }}
                        >
                            <Plus className="h-4 w-4" />
                            New workspace
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>

            <CreateWorkspaceDialog
                repoId={repoId}
                open={createOpen}
                onOpenChange={setCreateOpen}
                onCreated={handleCreated}
            />
        </div>
    );
}
