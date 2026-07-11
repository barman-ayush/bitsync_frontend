'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, GitCommit, FileText, User, GitPullRequest, MessageSquare, Loader2, Trash2, AlertCircle, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import { usePRDetails, PRComment } from '@/hooks/use-pr-details';
import { usePRCommits } from '@/hooks/use-pr-commits';
import { useBlobContent } from '@/hooks/use-blob-content';
import { useToast } from '@/components/toast-provider';
import { SafeFileContentRenderer } from '@/components/safe-file-content-renderer.component';

export interface ReviewViewConflict {
    filePath: string;
    conflictType: 'EDIT_EDIT' | 'DELETE_EDIT' | 'ADD_ADD' | 'DIR_FILE';
    baseBlob: string | null;
    oursBlob: string | null;
    theirsBlob: string | null;
    resolvedBlob: string | null;
    resolution: 'PENDING' | 'TAKE_OURS' | 'TAKE_THEIRS' | 'MANUAL';
    resolvedAt: string | null;
}

export interface ReviewViewNormalChange {
    path: string;
    type: 'blob' | 'tree';
    changeType: 'ADD' | 'MODIFY' | 'DELETE' | 'RENAME';
    oldObjectHash?: string;
    newObjectHash?: string;
    oldPath?: string;
    size?: number;
}

interface ReviewerPrDetailsViewProps {
    repoId: string;
    prId: string;
    onBack: () => void;
}

export function ReviewerPrDetailsView({ repoId, prId, onBack }: ReviewerPrDetailsViewProps) {
    const { addToast } = useToast();
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    // Review Status
    type ReviewVerdict = 'PENDING' | 'APPROVED' | 'CHANGES_REQUESTED' | 'PR_CLOSED';
    const [reviewVerdict, setReviewVerdict] = useState<ReviewVerdict | null>(null);
    const [isLoadingReviewStatus, setIsLoadingReviewStatus] = useState(true);
    
    // Comments States (similar to pr-details-view)
    const [commentsList, setCommentsList] = useState<PRComment[]>([]);
    const [generalDraft, setGeneralDraft] = useState('');
    const [showGeneralCommentInput, setShowGeneralCommentInput] = useState(false);
    const [isPostingComment, setIsPostingComment] = useState(false);
    const [isDeletingComment, setIsDeletingComment] = useState<{ [key: string]: boolean }>({});

    // For normal files diff view modes
    const [selectedViewModes, setSelectedViewModes] = useState<{ [key: string]: 'old' | 'new' }>({});
    
    // For conflict files view modes ('ours' | 'theirs' | 'base')
    const [conflictViewModes, setConflictViewModes] = useState<{ [key: string]: 'ours' | 'theirs' | 'base' }>({});
    
    const diffRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    // Fetch PR Details, Comments and Commits
    const { pr, isLoading: isLoadingPR, error: prError } = usePRDetails(repoId, prId);
    const { commits, isLoading: isLoadingCommits, error: commitsError } = usePRCommits(repoId, pr?.workspaceId);

    // Fetch Conflicts & Normal Changes from /api/pr/review-view/:repoId/:workspaceId/:prId
    const [changesData, setChangesData] = useState<{ conflicts: ReviewViewConflict[]; normalChanges: ReviewViewNormalChange[] } | null>(null);
    const [isLoadingChanges, setIsLoadingChanges] = useState(true);
    const [changesError, setChangesError] = useState<string | null>(null);

    // Sync comments list when PR is loaded
    useEffect(() => {
        if (pr?.comments) {
            setCommentsList(pr.comments);
        }
    }, [pr]);

    // Fetch current review status for this reviewer
    useEffect(() => {
        let isMounted = true;
        async function fetchReviewStatus() {
            setIsLoadingReviewStatus(true);
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/pr/review-status/${encodeURIComponent(repoId)}/${encodeURIComponent(prId)}`,
                    { credentials: 'include' }
                );
                if (res.ok) {
                    const json = await res.json();
                    if (isMounted) setReviewVerdict(json.data?.verdict ?? 'PENDING');
                } else {
                    // Not found means not assigned – treat as PENDING
                    if (isMounted) setReviewVerdict('PENDING');
                }
            } catch {
                if (isMounted) setReviewVerdict('PENDING');
            } finally {
                if (isMounted) setIsLoadingReviewStatus(false);
            }
        }
        fetchReviewStatus();
        return () => { isMounted = false; };
    }, [repoId, prId]);

    useEffect(() => {
        const wId = pr?.workspaceId;
        if (!wId) return;

        let isMounted = true;
        async function fetchChanges() {
            setIsLoadingChanges(true);
            setChangesError(null);
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/pr/review-view/${encodeURIComponent(repoId)}/${encodeURIComponent(wId!)}/${encodeURIComponent(prId)}`,
                    { credentials: 'include' }
                );
                if (!response.ok) {
                    throw new Error('Failed to fetch review changes');
                }
                const json = await response.json();
                if (isMounted) {
                    setChangesData(json.data);
                }
            } catch (err: any) {
                if (isMounted) {
                    setChangesError(err.message || 'Failed to load changes');
                }
            } finally {
                if (isMounted) {
                    setIsLoadingChanges(false);
                }
            }
        }

        fetchChanges();
        return () => {
            isMounted = false;
        };
    }, [repoId, prId, pr?.workspaceId]);

    const scrollToDiff = (diffId: string) => {
        const el = diffRefs.current[diffId];
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const toggleViewMode = (diffId: string, mode: 'old' | 'new') => {
        setSelectedViewModes((prev) => ({ ...prev, [diffId]: mode }));
    };

    const toggleConflictMode = (filePath: string, mode: 'ours' | 'theirs' | 'base') => {
        setConflictViewModes((prev) => ({ ...prev, [filePath]: mode }));
    };

    // Comments handlers
    const handleAddComment = async () => {
        if (!generalDraft.trim() || isPostingComment) return;
        setIsPostingComment(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pr/comment/${encodeURIComponent(repoId)}/${encodeURIComponent(prId)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ body: generalDraft.trim() }),
                credentials: 'include',
            });
            const json = await res.json().catch(() => null);
            if (res.ok && json?.data) {
                setCommentsList(prev => [...prev, json.data]);
                setGeneralDraft('');
                setShowGeneralCommentInput(false);
            } else {
                addToast(json?.message ?? 'Failed to add comment', 'error');
            }
        } catch (err: any) {
            addToast(err.message ?? 'Network error', 'error');
        } finally {
            setIsPostingComment(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (isDeletingComment[commentId]) return;
        setIsDeletingComment(prev => ({ ...prev, [commentId]: true }));
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pr/comment/${encodeURIComponent(repoId)}/${encodeURIComponent(prId)}/${encodeURIComponent(commentId)}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            const json = await res.json().catch(() => null);
            if (res.ok) {
                setCommentsList(prev => prev.filter(c => c.id !== commentId));
            } else {
                addToast(json?.message ?? 'Failed to delete comment', 'error');
            }
        } catch (err: any) {
            addToast(err.message ?? 'Network error', 'error');
        } finally {
            setIsDeletingComment(prev => ({ ...prev, [commentId]: false }));
        }
    };

    // Submitting review verdict (Approve / Request Changes)
    const handleSubmitReview = async (verdict: 'APPROVED' | 'CHANGES_REQUESTED') => {
        setIsSubmittingReview(true);
        try {
            const reviewRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pr/submit-review/${encodeURIComponent(repoId)}/${encodeURIComponent(prId)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verdict }),
                credentials: 'include',
            });

            if (!reviewRes.ok) {
                const errJson = await reviewRes.json().catch(() => null);
                addToast(errJson?.message ?? 'Failed to submit review verdict', 'error');
            } else {
                addToast(`Review submitted as ${verdict.replace('_', ' ')}!`, 'success');
                setReviewVerdict(verdict); // Update local status badge immediately
            }
        } catch (err: any) {
            addToast(err.message || 'Network error during review submission', 'error');
        } finally {
            setIsSubmittingReview(false);
        }
    };

    if (isLoadingPR || isLoadingChanges) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-background border-t">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (prError || changesError || !pr || !changesData) {
        return (
            <div className="flex flex-col h-full w-full items-center justify-center bg-background border-t gap-4">
                <p className="text-muted-foreground">{prError?.message || changesError || 'Failed to load pull request details.'}</p>
                <Button variant="outline" onClick={onBack}>Go Back</Button>
            </div>
        );
    }

    const { conflicts, normalChanges } = changesData;

    return (
        <div className="flex h-full w-full bg-background overflow-hidden border-t">
            
            {/* Left Sidebar - Changed Files list */}
            <div className="w-64 border-r bg-muted/20 flex flex-col h-full shrink-0">
                <div className="p-4 border-b">
                    <Button variant="ghost" size="sm" onClick={onBack} className="mb-2 -ml-2 text-muted-foreground hover:text-foreground">
                        <ChevronLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                    <h3 className="font-semibold text-sm text-foreground">Changed Files</h3>
                    <p className="text-xs text-muted-foreground">{conflicts.length + normalChanges.length} files modified</p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2 no-scrollbar">
                    {/* Conflicted Files list */}
                    {conflicts.length > 0 && (
                        <div className="mb-4">
                            <span className="text-[10px] font-bold text-red-500/80 uppercase tracking-wider px-2 block mb-1">Conflicts ({conflicts.length})</span>
                            {conflicts.map((c) => (
                                <button
                                    key={c.filePath}
                                    onClick={() => scrollToDiff(c.filePath)}
                                    className="w-full text-left px-3 py-1.5 text-xs rounded-md hover:bg-red-500/10 text-red-600 transition-colors truncate mb-0.5 flex items-center justify-between group"
                                    title={c.filePath}
                                >
                                    <span className="truncate flex items-center min-w-0">
                                        <AlertCircle className="inline-block h-3.5 w-3.5 mr-1.5 shrink-0 text-red-500" />
                                        <span className="truncate">{c.filePath}</span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Normal Files list */}
                    <div>
                        {conflicts.length > 0 && <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 block mb-1">Normal Changes</span>}
                        {normalChanges.map((change) => (
                            <button
                                key={change.path}
                                onClick={() => scrollToDiff(change.path)}
                                className="w-full text-left px-3 py-1.5 text-xs rounded-md hover:bg-muted/50 transition-colors truncate mb-0.5 flex items-center justify-between group"
                                title={change.path}
                            >
                                <span className="truncate flex items-center min-w-0">
                                    <FileText className="inline-block h-3.5 w-3.5 mr-1.5 shrink-0 text-muted-foreground group-hover:text-foreground" />
                                    <span className="truncate">{change.path}</span>
                                </span>
                                <span className={`text-[9px] font-mono font-semibold px-1 py-0.2 rounded ml-1.5 shrink-0 ${
                                    change.changeType === 'ADD' ? 'bg-green-500/10 text-green-500' :
                                    change.changeType === 'DELETE' ? 'bg-red-500/10 text-red-500' :
                                    'bg-blue-500/10 text-blue-500'
                                }`}>
                                    {change.changeType}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 scroll-smooth no-scrollbar">
                <div className="max-w-4xl w-full mx-auto space-y-10 pb-20">
                    
                    {/* Title, metadata and review action buttons */}
                    <div className="flex items-start justify-between gap-4 border-b pb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                                <GitPullRequest className="h-6 w-6 text-primary" />
                                Review PR: {pr.title}
                            </h1>
                            <p className="text-xs text-muted-foreground mt-1">
                                Requested by <span className="font-semibold text-foreground">{pr.author?.displayName || pr.authorId}</span> &bull; Status: <span className="font-semibold text-foreground">{pr.status}</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {isLoadingReviewStatus ? (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading status...
                                </div>
                            ) : reviewVerdict === 'APPROVED' ? (
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-500/10 border border-green-500/30 px-3 py-1.5 rounded-lg">
                                    <CheckCircle2 className="h-4 w-4" /> Approved
                                </span>
                            ) : reviewVerdict === 'CHANGES_REQUESTED' ? (
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-lg">
                                    <XCircle className="h-4 w-4" /> Changes Requested
                                </span>
                            ) : reviewVerdict === 'PR_CLOSED' ? (
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground bg-muted border px-3 py-1.5 rounded-lg">
                                    <MinusCircle className="h-4 w-4" /> PR Closed
                                </span>
                            ) : (
                                // PENDING – show actionable buttons
                                <>
                                    <Button
                                        onClick={() => handleSubmitReview('APPROVED')}
                                        disabled={isSubmittingReview}
                                        className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs h-9 gap-1.5"
                                    >
                                        {isSubmittingReview ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                        Approve PR
                                    </Button>
                                    <Button
                                        onClick={() => handleSubmitReview('CHANGES_REQUESTED')}
                                        disabled={isSubmittingReview}
                                        variant="destructive"
                                        className="font-semibold text-xs h-9 gap-1.5"
                                    >
                                        {isSubmittingReview ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                                        Request Changes
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="bg-muted/30 border rounded-lg p-4">
                        <h3 className="text-sm font-semibold mb-2">Description</h3>
                        <p className="text-sm text-foreground/80 whitespace-pre-wrap">{pr.description || 'No description provided.'}</p>
                    </div>

                    {/* Commit History (Trail) */}
                    <section>
                        <h2 className="text-lg font-semibold mb-4 border-b pb-2">Commit Trail</h2>
                        <div className="space-y-3">
                            {isLoadingCommits ? (
                                <div className="py-6 text-center text-sm text-muted-foreground flex justify-center items-center">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading commits...
                                </div>
                            ) : commitsError ? (
                                <div className="py-6 text-center text-sm text-destructive">{commitsError}</div>
                            ) : commits.length === 0 ? (
                                <div className="py-6 text-center text-sm text-muted-foreground">No commits found.</div>
                            ) : (
                                commits.map((commit) => (
                                    <div key={commit.commitHash} className="flex gap-4 items-start text-xs">
                                        <div className="mt-0.5 shrink-0 bg-muted h-6 w-6 rounded-full flex items-center justify-center">
                                            <GitCommit className="h-3 w-3 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1 bg-card border rounded-lg p-2.5">
                                            <div className="flex items-center justify-between font-medium">
                                                <span>{commit.message}</span>
                                                <span className="text-muted-foreground font-mono text-[10px]">{commit.commitHash.slice(0, 8)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    {/* Comments Thread (matching standard view) */}
                    <section>
                        <div className="flex items-center justify-between border-b pb-2 mb-4">
                            <h2 className="text-lg font-semibold">Comments ({commentsList.length})</h2>
                            {!showGeneralCommentInput && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowGeneralCommentInput(true)}
                                >
                                    <MessageSquare className="w-4 h-4 mr-2" /> Add comment
                                </Button>
                            )}
                        </div>

                        <div className="space-y-4">
                            {commentsList.length === 0 && !showGeneralCommentInput && (
                                <p className="text-sm text-muted-foreground italic">No comments added yet.</p>
                            )}

                            {commentsList.map((comment) => (
                                <div key={comment.id} className="bg-card border rounded-lg p-4 text-sm text-foreground flex flex-col gap-2 group shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-muted-foreground text-xs">
                                            <User className="h-4 w-4" />
                                            <span className="font-semibold text-foreground">{comment.author?.displayName || comment.author?.username || comment.authorId}</span>
                                            <span>&bull;</span>
                                            <span>{new Date(comment.createdAt).toLocaleString()}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-muted-foreground hover:text-destructive transition-colors opacity-80 group-hover:opacity-100"
                                            onClick={() => handleDeleteComment(comment.id)}
                                            disabled={isDeletingComment[comment.id]}
                                            title="Delete comment"
                                        >
                                            {isDeletingComment[comment.id] ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-3.5 w-3.5" />
                                            )}
                                        </Button>
                                    </div>
                                    <p className="whitespace-pre-wrap text-sm">{comment.body}</p>
                                </div>
                            ))}

                            {showGeneralCommentInput && (
                                <div className="flex flex-col gap-2 bg-card border rounded-lg p-4 shadow-sm">
                                    <textarea
                                        className="w-full min-h-[90px] p-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                                        placeholder="Write a comment on this pull request..."
                                        value={generalDraft}
                                        onChange={(e) => setGeneralDraft(e.target.value)}
                                        disabled={isPostingComment}
                                        autoFocus
                                    />
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setShowGeneralCommentInput(false);
                                                setGeneralDraft('');
                                            }}
                                            disabled={isPostingComment}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={handleAddComment}
                                            disabled={isPostingComment || !generalDraft.trim()}
                                        >
                                            {isPostingComment ? (
                                                <>
                                                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                                    Adding...
                                                </>
                                            ) : (
                                                'Add comment'
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* File changes & conflicts */}
                    <section className="space-y-6">
                        <h2 className="text-lg font-semibold border-b pb-2">File Changes</h2>
                        
                        {/* Render Conflicts */}
                        {conflicts.map((conflict) => {
                            const activeMode = conflictViewModes[conflict.filePath] || 'theirs';
                            return (
                                <div
                                    key={conflict.filePath}
                                    id={conflict.filePath}
                                    ref={(el) => { if (el) diffRefs.current[conflict.filePath] = el; }}
                                    className="border border-destructive/20 rounded-lg bg-card overflow-hidden scroll-mt-6"
                                >
                                    <div className="bg-destructive/5 px-4 py-2 border-b border-destructive/10 flex items-center justify-between">
                                        <div className="font-mono text-sm font-medium text-destructive flex items-center gap-1.5">
                                            <AlertCircle className="h-4 w-4 shrink-0" />
                                            <span>{conflict.filePath}</span>
                                        </div>
                                        <span className="text-[10px] font-bold bg-destructive/15 text-destructive px-2 py-0.5 rounded">
                                            CONFLICT ({conflict.conflictType})
                                        </span>
                                    </div>

                                    {/* Displaying 3 hashes fields */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-muted/10 border-b border-border text-xs font-mono text-muted-foreground">
                                        <div className="bg-background p-2.5 border rounded-md">
                                            <div className="font-sans font-semibold text-foreground mb-1">Base Commit (Ancestor)</div>
                                            <div className="truncate" title={conflict.baseBlob ?? 'None'}>
                                                Hash: {conflict.baseBlob ? `${conflict.baseBlob.slice(0, 12)}...` : 'None'}
                                            </div>
                                        </div>
                                        <div className="bg-background p-2.5 border rounded-md">
                                            <div className="font-sans font-semibold text-foreground mb-1">Mainline Change (Ours)</div>
                                            <div className="truncate" title={conflict.oursBlob ?? 'None'}>
                                                Hash: {conflict.oursBlob ? `${conflict.oursBlob.slice(0, 12)}...` : 'None'}
                                            </div>
                                        </div>
                                        <div className="bg-background p-2.5 border rounded-md">
                                            <div className="font-sans font-semibold text-foreground mb-1">PR Commit Change (Theirs)</div>
                                            <div className="truncate" title={conflict.theirsBlob ?? 'None'}>
                                                Hash: {conflict.theirsBlob ? `${conflict.theirsBlob.slice(0, 12)}...` : 'None'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* File content viewer wrapper */}
                                    <div className="p-4 bg-background">
                                        <div className="flex bg-muted rounded-md p-0.5 w-fit mb-4">
                                            {['ours', 'theirs', 'base'].map((mode) => (
                                                <button
                                                    key={mode}
                                                    onClick={() => toggleConflictMode(conflict.filePath, mode as any)}
                                                    className={`px-3 py-1 text-xs font-semibold rounded-sm transition-colors uppercase ${
                                                        activeMode === mode
                                                            ? 'bg-background shadow-sm text-foreground'
                                                            : 'text-muted-foreground hover:text-foreground'
                                                    }`}
                                                >
                                                    {mode === 'ours' ? 'Ours (Mainline)' : mode === 'theirs' ? 'Theirs (PR)' : 'Base (Ancestor)'}
                                                </button>
                                            ))}
                                        </div>

                                        <DraftFileContentViewer
                                            repoId={repoId}
                                            blobHash={
                                                activeMode === 'ours'
                                                    ? conflict.oursBlob
                                                    : activeMode === 'theirs'
                                                    ? conflict.theirsBlob
                                                    : conflict.baseBlob
                                            }
                                            label={
                                                activeMode === 'ours'
                                                    ? 'Ours (Mainline version)'
                                                    : activeMode === 'theirs'
                                                    ? 'Theirs (PR version)'
                                                    : 'Base (Ancestor version)'
                                            }
                                            filePath={conflict.filePath}
                                        />
                                    </div>
                                </div>
                            );
                        })}

                        {/* Render Normal Changes */}
                        {normalChanges.map((change) => {
                            const mode = selectedViewModes[change.path] || 'new';
                            return (
                                <div
                                    key={change.path}
                                    id={change.path}
                                    ref={(el) => { if (el) diffRefs.current[change.path] = el; }}
                                    className="border rounded-lg bg-card overflow-hidden scroll-mt-6"
                                >
                                    <div className="flex items-center justify-between bg-muted/40 px-4 py-2 border-b">
                                        <div className="font-mono text-sm font-medium flex items-center gap-2">
                                            <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                                                change.changeType === 'ADD' ? 'bg-green-500/10 text-green-500' :
                                                change.changeType === 'DELETE' ? 'bg-red-500/10 text-red-500' :
                                                'bg-blue-500/10 text-blue-500'
                                            }`}>
                                                {change.changeType}
                                            </span>
                                            <span>{change.path}</span>
                                        </div>
                                        
                                        <div className="flex bg-muted rounded-md p-0.5">
                                            <button
                                                onClick={() => toggleViewMode(change.path, 'old')}
                                                className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${mode === 'old' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                            >
                                                Old File
                                            </button>
                                            <button
                                                onClick={() => toggleViewMode(change.path, 'new')}
                                                className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${mode === 'new' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                            >
                                                Updated File
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-background">
                                        <DraftFileContentViewer
                                            repoId={repoId}
                                            blobHash={mode === 'old' ? change.oldObjectHash : change.newObjectHash}
                                            label={mode === 'old' ? 'Old File' : 'Updated File'}
                                            filePath={change.path}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </section>
                </div>
            </div>

        </div>
    );
}

function DraftFileContentViewer({ repoId, blobHash, label, filePath }: { repoId: string; blobHash: string | null | undefined; label: string; filePath: string }) {
    const { url, isLoading, error } = useBlobContent(repoId, blobHash);

    if (!blobHash) {
        return (
            <div className="flex flex-col items-center justify-center py-10 border border-dashed rounded-md bg-muted/10 text-muted-foreground text-xs">
                <span>{label}: No content available (File did not exist in this state).</span>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center gap-2 py-10 border rounded-md bg-muted/10 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading content…
            </div>
        );
    }

    if (error || !url) {
        return (
            <div className="py-10 text-center text-xs text-destructive border rounded-md bg-destructive/5">
                {error ?? 'Failed to load content for this blob'}
            </div>
        );
    }

    return (
        <SafeFileContentRenderer url={url} filePath={filePath} />
    );
}
