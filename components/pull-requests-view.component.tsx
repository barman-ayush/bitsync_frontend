'use client';

import { useState, useEffect } from 'react';
import { Search, GitPullRequest, GitMerge, GitPullRequestClosed, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { usePRList } from '@/hooks/use-pr-list';

export interface PullRequestsViewProps {
    repoId?: string;
}

export function PullRequestsView({ repoId }: PullRequestsViewProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [searchQuery]);

    const { prs, isLoading, hasMore, loadMore } = usePRList(repoId, debouncedQuery);

    const openCount = prs.filter((pr) => pr.status === 'OPEN').length;
    const closedCount = prs.length - openCount;

    return (
        <div className="flex flex-col h-full bg-background p-4 sm:p-6 overflow-y-auto">
            <div className="max-w-5xl mx-auto w-full space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <h2 className="text-2xl font-bold tracking-tight">Pull Requests</h2>
                    
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by title or author ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 w-full bg-muted/40"
                        />
                    </div>
                </div>

                <div className="rounded-md border bg-card">
                    {/* Header bar */}
                    <div className="flex items-center gap-4 border-b bg-muted/30 px-4 py-3 text-sm">
                        <button className="flex items-center gap-1.5 font-semibold text-foreground">
                            <GitPullRequest className="h-4 w-4" />
                            {openCount} Open
                        </button>
                        <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                            <GitPullRequestClosed className="h-4 w-4" />
                            {closedCount} Closed
                        </button>
                    </div>

                    {/* PR List */}
                    <div className="flex flex-col divide-y">
                        {prs.length === 0 && !isLoading ? (
                            <div className="py-12 text-center text-muted-foreground text-sm">
                                No pull requests found matching your search.
                            </div>
                        ) : (
                            prs.map((pr) => (
                                <div key={pr.id} className="flex gap-3 p-4 hover:bg-muted/30 transition-colors">
                                    <div className="mt-0.5 shrink-0">
                                        {pr.status === 'OPEN' && <GitPullRequest className="h-5 w-5 text-green-500" />}
                                        {pr.status === 'MERGED' && <GitMerge className="h-5 w-5 text-purple-500" />}
                                        {pr.status === 'CLOSED' && <GitPullRequestClosed className="h-5 w-5 text-destructive" />}
                                    </div>
                                    <div className="flex flex-1 flex-col min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <a href="#" className="font-semibold text-base text-foreground hover:text-primary hover:underline truncate">
                                                {pr.title}
                                            </a>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                                            <span className="font-mono">#{pr.id.slice(0, 8)}</span>
                                            <span>opened by</span>
                                            {/* We only have authorId right now */}
                                            <span className="font-medium text-foreground">{pr.authorId.slice(0, 8)}</span>
                                            <span>on {new Date(pr.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        
                        {isLoading && (
                            <div className="py-8 flex justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        )}
                        
                        {hasMore && !isLoading && (
                            <div className="p-4 border-t flex justify-center">
                                <Button variant="outline" onClick={loadMore}>
                                    Load more
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
