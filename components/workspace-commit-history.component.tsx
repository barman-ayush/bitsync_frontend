'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, Check, Copy, GitCommit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/toast-provider';
import { useCommitHistory } from '@/hooks/use-commit-history';
import type { CommitSummary } from '@/types/commits';

interface WorkspaceCommitHistoryProps {
    repoId: string | undefined;
    workspaceId: string | undefined;
    /** Return to the root folder listing and close the history pane. */
    onBack: () => void;
}

/** Relative "x minutes/hours/days ago" label for a commit timestamp. */
function formatRelative(iso: string): string {
    const then = new Date(iso).getTime();
    const diff = Math.max(0, Date.now() - then);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
    const years = Math.floor(months / 12);
    return `${years} year${years === 1 ? '' : 's'} ago`;
}

/** Absolute date, used for the day group headers (GitHub-style). */
function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

/** Initials for the author avatar, e.g. "Ayush Barman" -> "AB". */
function initialsOf(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Group consecutive commits by their calendar day, preserving order. */
function groupByDate(
    commits: CommitSummary[],
): { label: string; items: CommitSummary[] }[] {
    const groups: { label: string; items: CommitSummary[] }[] = [];
    for (const commit of commits) {
        const label = formatDate(commit.createdAt);
        const last = groups[groups.length - 1];
        if (last && last.label === label) last.items.push(commit);
        else groups.push({ label, items: [commit] });
    }
    return groups;
}

/**
 * The commit-history pane that replaces the file listing. A "Back" button in the
 * top bar (where the breadcrumb usually sits) returns to the root folder.
 * Commits are listed newest first, grouped by day, each showing its message and
 * metadata. Data is mocked for now via {@link useCommitHistory}.
 */
export function WorkspaceCommitHistory({
    repoId,
    workspaceId,
    onBack,
}: WorkspaceCommitHistoryProps) {
    const { commits, status, error } = useCommitHistory(repoId, workspaceId);
    const groups = useMemo(() => groupByDate(commits), [commits]);

    return (
        <>
            {/* Top bar: replaces the breadcrumb with a title + back action. */}
            <div className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onBack}
                        className="gap-1.5"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <span className="text-sm font-semibold text-foreground">
                        Commit history
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
                {status === 'loading' ? (
                    <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                        <Spinner className="h-4 w-4" /> Loading commits…
                    </div>
                ) : status === 'error' ? (
                    <div className="py-12 text-center text-sm text-destructive">
                        {error ?? 'Could not load the commit history'}
                    </div>
                ) : commits.length === 0 ? (
                    <div className="py-12 text-center text-sm text-muted-foreground">
                        No commits yet.
                    </div>
                ) : (
                    <div className="mx-auto max-w-3xl space-y-6">
                        {groups.map((group) => (
                            <div key={group.label}>
                                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                                    <GitCommit className="h-3.5 w-3.5" />
                                    Commits on {group.label}
                                </div>
                                <ul className="overflow-hidden rounded-lg border border-border divide-y divide-border">
                                    {group.items.map((commit) => (
                                        <CommitRow key={commit.hash} commit={commit} />
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

function CommitRow({ commit }: { commit: CommitSummary }) {
    const { addToast } = useToast();
    const [copied, setCopied] = useState(false);

    const title = commit.message.split('\n')[0];
    const shortHash = commit.hash.slice(0, 7);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(commit.hash);
            setCopied(true);
            addToast('Commit hash copied.', 'success');
            window.setTimeout(() => setCopied(false), 1500);
        } catch {
            addToast('Could not copy the commit hash.', 'error');
        }
    };

    return (
        <li className="flex items-start gap-3 px-4 py-3 transition hover:bg-muted">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                {initialsOf(commit.author.name)}
            </span>

            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                    {title}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                        {commit.author.name}
                    </span>{' '}
                    committed {formatRelative(commit.createdAt)}
                </p>
            </div>

            <button
                type="button"
                onClick={handleCopy}
                title="Copy full commit hash"
                className="flex shrink-0 items-center gap-1.5 rounded-md border border-border px-2 py-1 font-mono text-xs text-muted-foreground transition hover:bg-background hover:text-foreground"
            >
                {shortHash}
                {copied ? (
                    <Check className="h-3.5 w-3.5 text-accent" />
                ) : (
                    <Copy className="h-3.5 w-3.5" />
                )}
            </button>
        </li>
    );
}
