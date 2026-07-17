'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, GitPullRequest, GitMerge, GitPullRequestClosed, Loader2, AlertCircle, User, Calendar, CheckCircle2, XCircle, HelpCircle, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useDebounce } from '@/hooks/use-debounce';
import { ReviewerPrDetailsView } from './reviewer-pr-details-view.component';

export interface AssignedReviewPR {
    id: string;
    repoId: string;
    workspaceId: string;
    title: string;
    description: string | null;
    status: 'OPEN' | 'MERGED' | 'CLOSED';
    prHead: string;
    baseCommit: string | null;
    mergeCommit: string | null;
    createdAt: string;
    updatedAt: string;
    reviewId: string;
    reviewVerdict: 'PENDING' | 'APPROVED' | 'CHANGES_REQUESTED' | 'PR_CLOSED';
    reviewCreatedAt: string;
    author: {
        id: string;
        displayName: string;
        email: string;
        username: string;
    };
}

interface ReviewRequestsViewProps {
    repoId: string;
    prId?: string;
    onPrIdChange: (prId: string | undefined) => void;
}

type VerdictFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'CHANGES_REQUESTED' | 'PR_CLOSED';
type StatusFilter = 'ALL' | 'OPEN' | 'MERGED' | 'CLOSED';

export function ReviewRequestsView({ repoId, prId, onPrIdChange }: ReviewRequestsViewProps) {
    const [reviews, setReviews] = useState<AssignedReviewPR[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);

    // Filters
    const [selectedVerdict, setSelectedVerdict] = useState<VerdictFilter>('ALL');
    const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedQuery = useDebounce(searchQuery, 400);

    const fetchReviews = useCallback(
        async (cursor: string | null, isRefresh = false) => {
            if (!repoId) return;

            setIsLoading(true);
            setError(null);
            try {
                const url = new URL(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/pr/assigned-reviews/${encodeURIComponent(repoId)}`
                );
                url.searchParams.set('limit', '20');
                if (cursor) {
                    url.searchParams.set('cursor', cursor);
                }
                if (selectedVerdict !== 'ALL') {
                    url.searchParams.set('verdict', selectedVerdict);
                }
                if (debouncedQuery) {
                    url.searchParams.set('q', debouncedQuery);
                }

                const res = await fetch(url.toString(), {
                    credentials: 'include',
                });

                if (!res.ok) {
                    const errorBody = await res.json().catch(() => null);
                    setError(errorBody?.message ?? 'Failed to fetch reviews');
                    return;
                }

                const body = await res.json();
                if (body.status === 'success') {
                    const newReviews: AssignedReviewPR[] = body.data || [];
                    setReviews((prev) => (isRefresh ? newReviews : [...prev, ...newReviews]));
                    setHasMore(body.pagination?.hasMore ?? false);
                    setNextCursor(body.pagination?.nextCursor ?? null);
                }
            } catch (error: any) {
                setError(error.message || 'An unexpected error occurred.');
            } finally {
                setIsLoading(false);
            }
        },
        [repoId, selectedVerdict, debouncedQuery]
    );

    useEffect(() => {
        setReviews([]);
        setNextCursor(null);
        setHasMore(false);
        fetchReviews(null, true);
    }, [repoId, selectedVerdict, debouncedQuery, fetchReviews]);

    const loadMore = () => {
        if (!isLoading && hasMore && nextCursor) {
            fetchReviews(nextCursor, false);
        }
    };

    // Client-side filtering only for status
    const filteredReviews = reviews.filter((review) => {
        if (selectedStatus !== 'ALL' && review.status !== selectedStatus) {
            return false;
        }
        return true;
    });

    const getVerdictBadge = (verdict: AssignedReviewPR['reviewVerdict']) => {
        switch (verdict) {
            case 'APPROVED':
                return (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                        <CheckCircle2 className="h-3 w-3" /> Approved
                    </span>
                );
            case 'CHANGES_REQUESTED':
                return (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                        <XCircle className="h-3 w-3" /> Changes Requested
                    </span>
                );
            case 'PR_CLOSED':
                return (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                        <XCircle className="h-3 w-3" /> PR Closed
                    </span>
                );
            case 'PENDING':
            default:
                return (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <HelpCircle className="h-3 w-3" /> Pending Review
                    </span>
                );
        }
    };

    const getStatusIcon = (status: AssignedReviewPR['status']) => {
        switch (status) {
            case 'OPEN':
                return <GitPullRequest className="h-4 w-4 text-green-500 shrink-0" />;
            case 'MERGED':
                return <GitMerge className="h-4 w-4 text-purple-500 shrink-0" />;
            case 'CLOSED':
                return <GitPullRequestClosed className="h-4 w-4 text-red-500 shrink-0" />;
        }
    };

    if (prId) {
        return (
            <ReviewerPrDetailsView
                repoId={repoId}
                prId={prId}
                onBack={() => {
                    onPrIdChange(undefined);
                    fetchReviews(null, true);
                }}
            />
        );
    }

    return (
        <div className="flex flex-col h-full bg-background p-4 sm:p-6 overflow-y-auto">
            <div className="max-w-5xl mx-auto w-full space-y-6">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-border pb-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Review Requests</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Pull requests you have been requested to review.
                        </p>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-card border border-border rounded-xl p-4 space-y-4">
                    <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                        
                        {/* Search Input */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <Input
                                placeholder="Search by title, description or author..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-10 w-full"
                            />
                        </div>

                        {/* PR Status Filter */}
                        <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-1">Status:</span>
                            <div className="flex bg-muted p-0.5 rounded-lg border border-border">
                                {['ALL', 'OPEN', 'MERGED', 'CLOSED'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setSelectedStatus(status as StatusFilter)}
                                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                                            selectedStatus === status
                                                ? 'bg-background text-foreground shadow-sm'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        {status === 'ALL' ? 'All' : status}
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Verdict Filter pills */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-2">Review Verdict:</span>
                        {['ALL', 'PENDING', 'APPROVED', 'CHANGES_REQUESTED', 'PR_CLOSED'].map((verdict) => (
                            <button
                                key={verdict}
                                onClick={() => setSelectedVerdict(verdict as VerdictFilter)}
                                className={`px-3 py-1 text-xs font-medium rounded-full border transition-all ${
                                    selectedVerdict === verdict
                                        ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                                        : 'bg-background border-border text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {verdict === 'ALL' ? 'All' : verdict.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Review Request Lists */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <span className="text-sm">Fetching review requests...</span>
                        </div>
                    ) : error ? (
                        <div className="py-12 text-center text-sm text-destructive border border-dashed rounded-xl bg-destructive/5 p-6 flex flex-col items-center gap-2">
                            <AlertCircle className="h-8 w-8" />
                            <span>{error}</span>
                        </div>
                    ) : filteredReviews.length === 0 ? (
                        <div className="py-12 text-center text-sm text-muted-foreground border border-dashed rounded-xl p-8 bg-muted/10">
                            <GitPullRequest className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
                            <p className="font-semibold text-foreground">No review requests found</p>
                            <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or search query.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredReviews.map((review) => (
                                <div
                                    key={review.reviewId}
                                    className="group flex flex-col md:flex-row md:items-center justify-between border border-border/80 bg-card hover:bg-muted/10 rounded-xl p-4 transition-all gap-4 shadow-sm"
                                >
                                    <div className="flex items-start gap-3.5 min-w-0">
                                        <div className="mt-1 shrink-0">
                                            {getStatusIcon(review.status)}
                                        </div>
                                        <div className="space-y-1.5 min-w-0">
                                            <button
                                                onClick={() => onPrIdChange(review.id)}
                                                className="text-base font-semibold text-foreground hover:text-primary transition-colors text-left font-sans block truncate"
                                            >
                                                {review.title}
                                            </button>
                                            
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                                                <span className="font-mono text-[11px] font-semibold text-muted-foreground">#{review.id.slice(0, 6)}</span>
                                                <span>&bull;</span>
                                                <span className="flex items-center gap-1">
                                                    <User className="h-3 w-3" /> By{' '}
                                                    <Link href={`/${review.author?.username || review.author?.id}`} className="hover:underline font-medium text-foreground">
                                                        {review.author?.displayName || 'Unknown'}
                                                    </Link>
                                                </span>
                                                <span>&bull;</span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" /> Requested {new Date(review.reviewCreatedAt).toLocaleDateString()}
                                                </span>
                                            </div>

                                            {review.description && (
                                                <p className="text-xs text-muted-foreground truncate max-w-xl font-normal">
                                                    {review.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                                        <div className="flex flex-col items-end gap-1.5">
                                            {getVerdictBadge(review.reviewVerdict)}
                                        </div>
                                        <Button
                                            onClick={() => onPrIdChange(review.id)}
                                            size="sm"
                                            variant="outline"
                                            className="h-9 px-4 font-semibold text-xs gap-1.5"
                                        >
                                            View PR
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {hasMore && (
                                <div className="flex justify-center pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={loadMore}
                                        disabled={isLoading}
                                        className="gap-2 font-semibold text-xs h-9 px-4"
                                    >
                                        {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                        Load More Reviews
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
