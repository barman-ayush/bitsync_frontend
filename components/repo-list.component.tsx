'use client';

import Link from 'next/link';
import { AlertCircle, FileText, GitCommit, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import type { RepoListData, RepoRole } from '@/types/repos';
import type { RepoListStatus } from '@/hooks/use-repo-list';

interface RepoListProps {
    data: RepoListData | null;
    status: RepoListStatus;
    error: string | null;
    page: number;
    onPageChange: (page: number) => void;
}

function formatRelative(iso: string): string {
    const now = Date.now();
    const then = new Date(iso).getTime();
    const diff = Math.max(0, now - then);
    const day = 24 * 60 * 60 * 1000;
    if (diff < day) return 'today';
    if (diff < 2 * day) return 'yesterday';
    if (diff < 30 * day) return `${Math.floor(diff / day)} days ago`;
    if (diff < 365 * day) {
        const months = Math.floor(diff / (30 * day));
        return `${months} month${months === 1 ? '' : 's'} ago`;
    }
    const years = Math.floor(diff / (365 * day));
    return `${years} year${years === 1 ? '' : 's'} ago`;
}

const ROLE_LABEL: Record<RepoRole, string> = {
    owner: 'Owner',
    admin: 'Admin',
    member: 'Member',
};

export function RepoList({ data, status, error, page, onPageChange }: RepoListProps) {
    const items = data?.items ?? [];
    const totalCount = data?.total_count ?? 0;
    const totalPages = data?.total_pages ?? 0;

    return (
        <div className="px-6 md:px-12 lg:px-20 pb-8">
            <div className="flex items-center justify-between border-y border-border py-3">
                <span className="text-sm font-semibold text-foreground">
                    {status === 'loading' && !data
                        ? 'Loading…'
                        : `${totalCount} ${totalCount === 1 ? 'repository' : 'repositories'}`}
                </span>
            </div>

            {status === 'error' && (
                <div className="flex items-center justify-center h-64 text-destructive">
                    <div className="text-center space-y-2">
                        <AlertCircle className="h-10 w-10 mx-auto opacity-70" />
                        <p className="text-base">Failed to load repositories</p>
                        <p className="text-sm text-muted-foreground">{error}</p>
                    </div>
                </div>
            )}

            {status === 'loading' && !data && <RepoListSkeleton />}

            {status !== 'error' && data && items.length === 0 && (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <div className="text-center space-y-2">
                        <FileText className="h-10 w-10 mx-auto opacity-50" />
                        <p className="text-base">No repositories found</p>
                        <p className="text-sm">Try adjusting your filters or search query</p>
                    </div>
                </div>
            )}

            {items.length > 0 && (
                <ul className="divide-y divide-border">
                    {items.map((repo) => (
                        <li key={repo.id} className="py-4 group">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Link
                                            href={`/${repo.owner.username}/${repo.name}`}
                                            className="text-base text-foreground hover:underline"
                                        >
                                            <span className="text-muted-foreground">{repo.owner.username}/</span>
                                            <span className="font-semibold text-primary">{repo.name}</span>
                                        </Link>
                                        <Badge
                                            variant="outline"
                                            className="rounded-full px-2 py-0 text-[11px] font-medium border-border text-muted-foreground"
                                        >
                                            {ROLE_LABEL[repo.role]}
                                        </Badge>
                                        {!repo.headCommit && (
                                            <Badge
                                                variant="outline"
                                                className="rounded-full px-2 py-0 text-[11px] font-medium border-amber-500/40 text-amber-600 dark:text-amber-400"
                                            >
                                                Empty
                                            </Badge>
                                        )}
                                    </div>

                                    {repo.description && (
                                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                                            {repo.description}
                                        </p>
                                    )}

                                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                        {repo.headCommit && (
                                            <span className="flex items-center gap-1">
                                                <GitCommit className="h-3.5 w-3.5" />
                                                {repo.headCommit.slice(0, 7)}
                                            </span>
                                        )}
                                        <span>Updated {formatRelative(repo.updatedAt)}</span>
                                        <span>Created {formatRelative(repo.createdAt)}</span>
                                        <button
                                            type="button"
                                            aria-label="Repository settings"
                                            className="ml-1 rounded-sm p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                                        >
                                            <Settings className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {totalPages > 1 && (
                <div className="pt-6">
                    <RepoPagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
                </div>
            )}
        </div>
    );
}

function RepoListSkeleton() {
    return (
        <ul className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="py-4">
                    <Skeleton className="h-5 w-64" />
                    <Skeleton className="mt-2 h-4 w-3/4" />
                    <Skeleton className="mt-2 h-3 w-48" />
                </li>
            ))}
        </ul>
    );
}

function RepoPagination({
    page,
    totalPages,
    onPageChange,
}: {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}) {
    const pages = computePageRange(page, totalPages);

    return (
        <Pagination>
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious
                        href="#"
                        aria-disabled={page <= 1}
                        className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
                        onClick={(e) => {
                            e.preventDefault();
                            if (page > 1) onPageChange(page - 1);
                        }}
                    />
                </PaginationItem>
                {pages.map((p, i) =>
                    p === '…' ? (
                        <PaginationItem key={`e-${i}`}>
                            <PaginationEllipsis />
                        </PaginationItem>
                    ) : (
                        <PaginationItem key={p}>
                            <PaginationLink
                                href="#"
                                isActive={p === page}
                                onClick={(e) => {
                                    e.preventDefault();
                                    onPageChange(p);
                                }}
                            >
                                {p}
                            </PaginationLink>
                        </PaginationItem>
                    ),
                )}
                <PaginationItem>
                    <PaginationNext
                        href="#"
                        aria-disabled={page >= totalPages}
                        className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
                        onClick={(e) => {
                            e.preventDefault();
                            if (page < totalPages) onPageChange(page + 1);
                        }}
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
}

function computePageRange(current: number, total: number): (number | '…')[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const out: (number | '…')[] = [1];
    const left = Math.max(2, current - 1);
    const right = Math.min(total - 1, current + 1);
    if (left > 2) out.push('…');
    for (let i = left; i <= right; i++) out.push(i);
    if (right < total - 1) out.push('…');
    out.push(total);
    return out;
}
