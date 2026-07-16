'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { usePRDetails, PRComment } from '@/hooks/use-pr-details';
import { usePRCommits } from '@/hooks/use-pr-commits';
import { usePrMergeability } from '@/hooks/use-pr-mergeability';
import { useBlobContent } from '@/hooks/use-blob-content';
import { useToast } from '@/components/toast-provider';
import { usePrChangesView } from '@/hooks/use-pr-changes-view';
import { SafeFileContentRenderer } from '@/components/safe-file-content-renderer.component';
import { useRepoReviewerSearch } from '@/hooks/use-repo-reviewer-search';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ChevronLeft, GitCommit, FileText, User, Calendar, GitPullRequest, MessageSquare, Loader2, Trash2, AlertCircle, CheckCircle2, XCircle, HelpCircle, Search, X, AlertTriangle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface PRDetailsViewProps {
    repoId: string;
    prId: string;
    onBack: () => void;
}

// Mock Data
const MOCK_PR_DETAILS = {
    title: 'Feature: Enhanced file viewer with syntax highlighting',
    description: 'This pull request adds syntax highlighting to the file viewer component. It also fixes some scrolling issues on mobile.',
    author: 'ayush-dev',
    createdAt: '2026-06-26T10:30:00Z',
    status: 'OPEN',
    commits: [
        { id: 'c1a2b3c', message: 'Add syntax highlighter dependency', date: '2026-06-25T14:20:00Z' },
        { id: 'd4e5f6g', message: 'Implement highlighting in FileViewer', date: '2026-06-25T16:45:00Z' },
        { id: 'h7i8j9k', message: 'Fix mobile scroll overflow', date: '2026-06-26T09:15:00Z' },
    ],
    diffs: [
        { id: 'diff1', fileName: 'components/file-viewer.tsx' },
        { id: 'diff2', fileName: 'package.json' },
        { id: 'diff3', fileName: 'styles/globals.css' },
        { id: 'diff4', fileName: 'utils/formatters.ts' },
    ]
};

export function PRDetailsView({ repoId, prId, onBack }: PRDetailsViewProps) {
    const { pr: fetchedPr, isLoading, error } = usePRDetails(repoId, prId);
    const mockData = MOCK_PR_DETAILS;
    const { addToast } = useToast();

    const diffRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
    const [selectedViewModes, setSelectedViewModes] = useState<{ [key: string]: string }>({});
    const [generalDraft, setGeneralDraft] = useState('');
    const [showGeneralCommentInput, setShowGeneralCommentInput] = useState(false);
    const [commentsList, setCommentsList] = useState<PRComment[]>([]);
    const [isPostingComment, setIsPostingComment] = useState(false);
    const [isDeletingComment, setIsDeletingComment] = useState<{ [key: string]: boolean }>({});
    const [isClosingPR, setIsClosingPR] = useState(false);
    const [isMerging, setIsMerging] = useState(false);
    const [resolutions, setResolutions] = useState<{ [filePath: string]: { conflictId: string; resolution: 'PENDING' | 'TAKE_OURS' | 'TAKE_THEIRS' | 'MANUAL'; resolvedBlob: string | null } }>({});
    const [initialResolutions, setInitialResolutions] = useState<{ [filePath: string]: { conflictId: string; resolution: 'PENDING' | 'TAKE_OURS' | 'TAKE_THEIRS' | 'MANUAL'; resolvedBlob: string | null } }>({});
    const [uploadingFiles, setUploadingFiles] = useState<{ [filePath: string]: boolean }>({});
    const [isSavingResolutions, setIsSavingResolutions] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [closeModalError, setCloseModalError] = useState<string | null>(null);

    // Review Status & Reviewers State
    const [reviews, setReviews] = useState<any[]>([]);
    const [isLoadingReviews, setIsLoadingReviews] = useState(true);
    const [reviewsError, setReviewsError] = useState<string | null>(null);

    const [reviewerSearch, setReviewerSearch] = useState('');
    const [selectedReviewers, setSelectedReviewers] = useState<any[]>([]);
    const [isAddingReviewers, setIsAddingReviewers] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    
    const { results: searchResults } = useRepoReviewerSearch(repoId, reviewerSearch);

    const fetchReviews = useCallback(async () => {
        setIsLoadingReviews(true);
        setReviewsError(null);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/pr/reviews/${encodeURIComponent(repoId)}/${encodeURIComponent(prId)}`,
                { credentials: 'include' }
            );
            if (!res.ok) throw new Error('Failed to fetch reviews');
            const json = await res.json();
            setReviews(json.data || []);
        } catch (err: any) {
            setReviewsError(err.message);
        } finally {
            setIsLoadingReviews(false);
        }
    }, [repoId, prId]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const existingReviewerIds = new Set(reviews.map((r) => r.reviewerId));
    const selectedReviewerIds = new Set(selectedReviewers.map((r) => r.id));
    
    const availableSearchResults = searchResults.filter(
        (user) => !existingReviewerIds.has(user.id) && !selectedReviewerIds.has(user.id)
    );

    const handleSelectReviewer = (user: any) => {
        setSelectedReviewers((prev) => [...prev, user]);
        setReviewerSearch('');
        setIsSearchFocused(false);
    };

    const handleAddReviewers = async () => {
        if (selectedReviewers.length === 0) return;
        setIsAddingReviewers(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/pr/add-reviewers/${encodeURIComponent(repoId)}/${encodeURIComponent(prId)}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        reviewerIds: selectedReviewers.map((u) => u.id),
                    }),
                    credentials: 'include',
                }
            );
            if (!res.ok) {
                const err = await res.json().catch(() => null);
                throw new Error(err?.message ?? 'Failed to add reviewers');
            }
            addToast('Reviewers added successfully.', 'success');
            setSelectedReviewers([]);
            fetchReviews();
        } catch (err: any) {
            addToast(err.message, 'error');
        } finally {
            setIsAddingReviewers(false);
        }
    };

    useEffect(() => {
        if (fetchedPr?.comments) {
            setCommentsList(fetchedPr.comments);
        }
    }, [fetchedPr]);

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

    const handleConfirmClosePR = async () => {
        setIsClosingPR(true);
        setCloseModalError(null);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pr/close/${encodeURIComponent(repoId)}/${encodeURIComponent(prId)}`, {
                method: 'POST',
                credentials: 'include',
            });
            const json = await res.json().catch(() => null);
            if (res.ok) {
                setShowCloseModal(false);
                window.location.reload();
            } else {
                setCloseModalError(json?.message ?? 'Failed to close pull request.');
            }
        } catch (err: any) {
            setCloseModalError(err.message ?? 'Network error');
        } finally {
            setIsClosingPR(false);
        }
    };

    const handleMerge = async () => {
        setIsMerging(true);
        try {
            const res1 = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pr/merge/${encodeURIComponent(repoId)}/${encodeURIComponent(prId)}`, {
                method: 'POST',
                credentials: 'include'
            });
            const data1 = await res1.json().catch(() => ({}));

            if (res1.ok) {
                addToast('Pull request merged successfully!', 'success');
                window.location.reload();
                return;
            }

            addToast(data1.message || 'Merge failed', 'error');
        } catch (err: any) {
            addToast(err.message || 'Network error during merge', 'error');
        } finally {
            setIsMerging(false);
        }
    };

    const handleSaveResolutions = async () => {
        setIsSavingResolutions(true);
        try {
            const resolvedList = Object.entries(resolutions)
                .filter(([_, r]) => r.resolution !== 'PENDING')
                .map(([_, r]) => ({
                    conflictId: r.conflictId,
                    resolution: r.resolution,
                    resolvedBlob: r.resolvedBlob
                }));

            if (resolvedList.length === 0) {
                addToast('No resolved conflicts to save.', 'info');
                setIsSavingResolutions(false);
                return;
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pr/resolve-conflicts/${encodeURIComponent(repoId)}/${encodeURIComponent(prId)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resolutions: resolvedList }),
                credentials: 'include'
            });

            const json = await res.json().catch(() => null);
            if (res.ok) {
                addToast(json?.message ?? 'Conflict resolutions saved successfully.', 'success');
                refetchChanges();
                refreshMergeability();
            } else {
                addToast(json?.message ?? 'Failed to save conflict resolutions.', 'error');
            }
        } catch (err: any) {
            addToast(err.message ?? 'Network error while saving resolutions', 'error');
        } finally {
            setIsSavingResolutions(false);
        }
    };

    const handleUndo = () => {
        setResolutions(JSON.parse(JSON.stringify(initialResolutions)));
        addToast('Local conflict resolutions undone.', 'info');
    };

    const handleFileUpload = async (filePath: string, conflictId: string, file: File) => {
        setUploadingFiles(prev => ({ ...prev, [filePath]: true }));
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/workspace/blob/${encodeURIComponent(repoId)}`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/octet-stream',
                    },
                    body: file,
                }
            );

            const json = await res.json().catch(() => null);
            const blobHash = json?.data?.blobHash;

            if (!res.ok || !blobHash) {
                addToast(json?.message ?? 'Failed to upload resolved file.', 'error');
                return;
            }

            setResolutions(prev => ({
                ...prev,
                [filePath]: {
                    conflictId,
                    resolution: 'MANUAL',
                    resolvedBlob: blobHash
                }
            }));
            setSelectedViewModes(prev => ({ ...prev, [filePath]: 'resolved' }));
            addToast('Resolved file uploaded successfully. Remember to click "Save Resolutions".', 'success');
        } catch (err: any) {
            addToast(err.message ?? 'Network error during file upload', 'error');
        } finally {
            setUploadingFiles(prev => ({ ...prev, [filePath]: false }));
        }
    };

    const scrollToDiff = (diffId: string) => {
        const el = diffRefs.current[diffId];
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const toggleViewMode = (diffId: string, mode: string) => {
        setSelectedViewModes((prev) => ({ ...prev, [diffId]: mode }));
    };

    const { commits, isLoading: isLoadingCommits, error: commitsError } = usePRCommits(repoId, fetchedPr?.workspaceId);
    const { mergeability: prMergeability, isLoading: isLoadingMergeability, refresh: refreshMergeability } = usePrMergeability(repoId, fetchedPr?.workspaceId, prId);
    const { files: changesFiles, isLoading: isLoadingChanges, error: changesError, refetch: refetchChanges } = usePrChangesView(
        repoId,
        fetchedPr?.workspaceId || undefined,
        prId
    );

    const isLoadingMergeCheck = isLoadingChanges;
    const mergeCheckError = changesError;

    useEffect(() => {
        if (changesFiles) {
            const initialRes: { [filePath: string]: { conflictId: string; resolution: 'PENDING' | 'TAKE_OURS' | 'TAKE_THEIRS' | 'MANUAL'; resolvedBlob: string | null } } = {};
            changesFiles.forEach(file => {
                if (file.isConflicted && file.conflictInfo) {
                    initialRes[file.path] = {
                        conflictId: file.conflictInfo.conflictId,
                        resolution: file.conflictInfo.resolution,
                        resolvedBlob: file.conflictInfo.resolvedBlob
                    };
                    if (file.conflictInfo.resolution !== 'PENDING') {
                        setSelectedViewModes(prev => ({ ...prev, [file.path]: 'resolved' }));
                    }
                }
            });
            setResolutions(JSON.parse(JSON.stringify(initialRes)));
            setInitialResolutions(JSON.parse(JSON.stringify(initialRes)));
        }
    }, [changesFiles]);

    const diffs = changesFiles.map(file => ({
        path: file.path,
        isConflict: file.isConflicted,
        conflictType: file.conflictInfo?.conflictType,
        changeType: file.changeType,
        oldBlobHash: file.oldObjectHash,
        newBlobHash: file.newObjectHash,
        baseBlob: file.conflictInfo?.baseBlob,
        oursBlob: file.conflictInfo?.oursBlob,
        theirsBlob: file.conflictInfo?.theirsBlob,
        conflictInfo: file.conflictInfo,
    }));

    const hasConflicts = fetchedPr?.status === 'OPEN' && (prMergeability ? (!prMergeability.canMerge && !prMergeability.isMerged) : diffs.some(d => d.isConflict));

    const hasLocalChanges = Object.keys(resolutions).some(path => {
        const current = resolutions[path];
        const initial = initialResolutions[path];
        if (!initial) return false;
        return current.resolution !== initial.resolution || current.resolvedBlob !== initial.resolvedBlob;
    });

    const allResolved = Object.keys(resolutions).length > 0 && Object.values(resolutions).every(r => r.resolution !== 'PENDING');

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-background border-t">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !fetchedPr) {
        return (
            <div className="flex flex-col h-full w-full items-center justify-center bg-background border-t gap-4">
                <p className="text-muted-foreground">Failed to load pull request details.</p>
                <Button variant="outline" onClick={onBack}>Go Back</Button>
            </div>
        );
    }

    const pr = fetchedPr;

    return (
        <div className="flex h-full w-full bg-background overflow-hidden border-t">
            {/* Left Sidebar */}
            <div className="w-64 border-r bg-muted/20 flex flex-col h-full shrink-0">
                <div className="p-4 border-b">
                    <Button variant="ghost" size="sm" onClick={onBack} className="mb-2 -ml-2 text-muted-foreground hover:text-foreground">
                        <ChevronLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                    <h3 className="font-semibold text-sm text-foreground">Changed Files</h3>
                    <p className="text-xs text-muted-foreground">{diffs.length} files modified</p>
                </div>
                <div className="flex-1 overflow-y-auto p-2 no-scrollbar">
                    {isLoadingMergeCheck ? (
                        <div className="py-4 text-center text-xs text-muted-foreground flex justify-center items-center">
                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Loading files...
                        </div>
                    ) : diffs.map((diff) => (
                        <button
                            key={diff.path}
                            onClick={() => scrollToDiff(diff.path)}
                            className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted/50 transition-colors truncate mb-1 flex items-center justify-between group"
                            title={diff.path}
                        >
                            <span className="truncate flex items-center min-w-0">
                                <FileText className="inline-block h-3.5 w-3.5 mr-2 shrink-0 text-muted-foreground group-hover:text-foreground" />
                                <span className="truncate">{diff.path}</span>
                            </span>
                            <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ml-2 shrink-0 ${diff.isConflict ? 'bg-red-500/10 text-red-500' :
                                diff.changeType === 'ADD' ? 'bg-green-500/10 text-green-500' :
                                    diff.changeType === 'DELETE' ? 'bg-red-500/10 text-red-500' :
                                        diff.changeType === 'RENAME' ? 'bg-purple-500/10 text-purple-500' :
                                            'bg-blue-500/10 text-blue-500'
                                }`}>
                                {diff.isConflict ? 'CONFLICT' : diff.changeType}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 scroll-smooth no-scrollbar">
                <div className="max-w-4xl w-full mx-auto space-y-10 pb-20">

                    {/* Section 1: PR Metadata */}
                    <section className="space-y-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="mt-1">
                                    <GitPullRequest className="h-8 w-8 text-green-500" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-foreground">
                                        {pr.title} <span className="text-muted-foreground font-normal">#{prId.slice(0, 6)}</span>
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <User className="h-4 w-4" /> {pr.author?.username || pr.authorId}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" /> {new Date(pr.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                                {hasConflicts ? (
                                    <div className="flex flex-col items-end gap-2">
                                        {/* Warning message */}
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded px-2.5 py-1 animate-pulse animate-duration-1000">
                                            <AlertCircle className="h-3.5 w-3.5" />
                                            <span>Please resolve conflicts before merging</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* Undo button: once selects at least one, show the undo button */}
                                            {hasLocalChanges ? (
                                                <Button
                                                    variant="outline"
                                                    onClick={handleUndo}
                                                    className="gap-1.5 cursor-pointer hover:bg-muted transition-colors animate-in fade-in duration-200"
                                                >
                                                    Undo
                                                </Button>
                                            ) : null}
                                            
                                            {/* Resolve Conflicts button: shown, clickable only when all selected */}
                                            {allResolved ? (
                                                <Button
                                                    onClick={handleSaveResolutions}
                                                    disabled={isSavingResolutions}
                                                    className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 cursor-pointer transition-all animate-in fade-in duration-200"
                                                >
                                                    {isSavingResolutions && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                                    Resolve Conflicts
                                                </Button>
                                            ) : (
                                                <Button
                                                    disabled
                                                    className="bg-muted text-muted-foreground gap-1.5 cursor-not-allowed opacity-50"
                                                >
                                                    Resolve Conflicts
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2">
                                            {pr.status === 'OPEN' && (
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        setCloseModalError(null);
                                                        setShowCloseModal(true);
                                                    }}
                                                    disabled={isClosingPR}
                                                    className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive gap-2"
                                                >
                                                    Close PR
                                                </Button>
                                            )}
                                            <Button
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                                disabled={
                                                    pr.status !== 'OPEN' ||
                                                    prMergeability?.isMerged ||
                                                    isMerging ||
                                                    isLoadingMergeability ||
                                                    (prMergeability !== null && !prMergeability.canMerge)
                                                }
                                                onClick={handleMerge}
                                                title={
                                                    prMergeability && !prMergeability.canMerge
                                                        ? `Cannot merge: ${prMergeability.conflictCount} unresolved conflicts remaining.`
                                                        : undefined
                                                }
                                            >
                                                {isMerging || isLoadingMergeability ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                                {pr.status === 'CLOSED' ? 'PR Closed' : (pr.status === 'MERGED' || prMergeability?.isMerged) ? 'PR Merged' : 'Merge PR'}
                                            </Button>
                                        </div>
                                        {prMergeability && !prMergeability.canMerge && !prMergeability.isMerged && pr.status === 'OPEN' && (
                                            <div className="flex items-center gap-1.5 text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded px-2.5 py-1">
                                                <AlertCircle className="h-3.5 w-3.5" />
                                                <span>{prMergeability.conflictCount} pending conflicts</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="bg-muted/30 border rounded-lg p-4 mt-4">
                            <h3 className="text-sm font-semibold mb-2">Description</h3>
                            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{pr.description}</p>
                        </div>
                    </section>

                    {/* Section 2: Commit History */}
                    <section>
                        <h2 className="text-lg font-semibold mb-4 border-b pb-2">Commit History</h2>
                        <div className="space-y-4">
                            {isLoadingCommits ? (
                                <div className="py-8 text-center text-sm text-muted-foreground flex justify-center items-center">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Loading commits...
                                </div>
                            ) : commitsError ? (
                                <div className="py-8 text-center text-sm text-destructive">
                                    {commitsError}
                                </div>
                            ) : commits.length === 0 ? (
                                <div className="py-8 text-center text-sm text-muted-foreground">
                                    No commits found.
                                </div>
                            ) : (
                                commits.map((commit) => (
                                    <div key={commit.commitHash} className="flex gap-4 items-start relative">
                                        <div className="mt-0.5 shrink-0 relative z-10 bg-background">
                                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                                <GitCommit className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        </div>
                                        <div className="flex-1 bg-card border rounded-lg p-3 text-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium">{commit.message}</span>
                                                <span className="text-muted-foreground text-xs font-mono">{commit.commitHash.length > 8 ? `${commit.commitHash.slice(0, 8)}...` : commit.commitHash}</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {new Date(commit.timestamp).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    {/* Section 2.5: Comments */}
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
                                <div key={comment.id} className="bg-card border rounded-lg p-4 text-sm text-foreground flex flex-col gap-2 group">
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
                                <div className="flex flex-col gap-2 bg-card border rounded-lg p-4">
                                    <textarea
                                        className="w-full min-h-[90px] p-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
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

                    {/* Section 3: Changed Files */}
                    <section>
                        <h2 className="text-lg font-semibold mb-4 border-b pb-2">Changed Files</h2>

                        {hasConflicts && (
                            <div className="flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-6 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center gap-2.5">
                                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 animate-pulse" />
                                    <div className="text-sm">
                                        <span className="font-semibold text-amber-800 dark:text-amber-300">Conflicts Detected</span>
                                        <p className="text-muted-foreground text-xs mt-0.5">Please resolve the files below by choosing Ours, Theirs, or uploading a resolved version, then click Save Resolutions.</p>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={handleSaveResolutions}
                                    disabled={isSavingResolutions}
                                    className="bg-amber-600 hover:bg-amber-700 text-white font-medium gap-1.5 cursor-pointer shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all"
                                >
                                    {isSavingResolutions && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                    Save Resolutions
                                </Button>
                            </div>
                        )}

                        <div className="space-y-6">
                            {isLoadingMergeCheck ? (
                                <div className="py-8 text-center text-sm text-muted-foreground flex justify-center items-center">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Loading file changes...
                                </div>
                            ) : mergeCheckError ? (
                                <div className="py-8 text-center text-sm text-destructive">
                                    {mergeCheckError}
                                </div>
                            ) : diffs.length === 0 ? (
                                <div className="py-8 text-center text-sm text-muted-foreground">
                                    No file changes found.
                                </div>
                            ) : (
                                diffs.map((diff) => {
                                    const isConflict = diff.isConflict;
                                    const mode = selectedViewModes[diff.path] || (isConflict ? 'ours' : 'new');
                                    return (
                                        <div
                                            key={diff.path}
                                            id={diff.path}
                                            ref={(el) => {
                                                if (el) diffRefs.current[diff.path] = el;
                                            }}
                                            className="border rounded-lg bg-card overflow-hidden scroll-mt-6 shadow-sm hover:shadow-md transition-shadow duration-200"
                                        >
                                            <div className="flex items-center justify-between bg-muted/40 px-4 py-2 border-b">
                                                <div className="font-mono text-sm font-medium flex items-center gap-2">
                                                    <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${diff.isConflict ? 'bg-red-500/10 text-red-500 animate-pulse' :
                                                        diff.changeType === 'ADD' ? 'bg-green-500/10 text-green-500' :
                                                            diff.changeType === 'DELETE' ? 'bg-red-500/10 text-red-500' :
                                                                'bg-blue-500/10 text-blue-500'
                                                        }`}>
                                                        {diff.isConflict ? 'CONFLICT' : diff.changeType}
                                                    </span>
                                                    <span>{diff.path}</span>
                                                </div>
                                                
                                                {isConflict ? (
                                                    <div className="flex bg-muted rounded-md p-0.5">
                                                        <button
                                                            onClick={() => toggleViewMode(diff.path, 'base')}
                                                            className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors cursor-pointer ${mode === 'base' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                                        >
                                                            Base
                                                        </button>
                                                        <button
                                                            onClick={() => toggleViewMode(diff.path, 'ours')}
                                                            className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors cursor-pointer ${mode === 'ours' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                                        >
                                                            Ours (Repo)
                                                        </button>
                                                        <button
                                                            onClick={() => toggleViewMode(diff.path, 'theirs')}
                                                            className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors cursor-pointer ${mode === 'theirs' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                                        >
                                                            Theirs (Workspace)
                                                        </button>
                                                        <button
                                                            onClick={() => toggleViewMode(diff.path, 'resolved')}
                                                            disabled={!resolutions[diff.path] || resolutions[diff.path].resolution === 'PENDING'}
                                                            className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${mode === 'resolved' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                                        >
                                                            Resolved
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex bg-muted rounded-md p-0.5">
                                                        <button
                                                            onClick={() => toggleViewMode(diff.path, 'old')}
                                                            className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors cursor-pointer ${mode === 'old' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                                        >
                                                            Old File
                                                        </button>
                                                        <button
                                                            onClick={() => toggleViewMode(diff.path, 'new')}
                                                            className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors cursor-pointer ${mode === 'new' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                                        >
                                                            Updated File
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-4 bg-background">
                                                {isConflict ? (
                                                    <div className="space-y-3">
                                                        <div className="text-xs font-mono text-muted-foreground bg-destructive/10 border border-destructive/20 p-2 rounded-md flex items-center justify-between">
                                                            <span className="font-semibold text-destructive flex items-center gap-1">
                                                                <AlertTriangle className="h-3.5 w-3.5" />
                                                                Conflict Type: {diff.conflictType}
                                                            </span>
                                                            <span>Base: {diff.baseBlob?.slice(0, 8) ?? 'none'} | Ours: {diff.oursBlob?.slice(0, 8) ?? 'none'} | Theirs: {diff.theirsBlob?.slice(0, 8) ?? 'none'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            <Button
                                                                size="sm"
                                                                variant={resolutions[diff.path]?.resolution === 'TAKE_OURS' ? 'default' : 'outline'}
                                                                onClick={() => {
                                                                    setResolutions(prev => ({
                                                                        ...prev,
                                                                        [diff.path]: {
                                                                            ...prev[diff.path],
                                                                            resolution: 'TAKE_OURS',
                                                                            resolvedBlob: diff.oursBlob ?? null
                                                                        }
                                                                    }));
                                                                    setSelectedViewModes(prev => ({ ...prev, [diff.path]: 'resolved' }));
                                                                }}
                                                                className="cursor-pointer transition-all active:scale-[0.98]"
                                                            >
                                                                Take Ours (Repo HEAD)
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant={resolutions[diff.path]?.resolution === 'TAKE_THEIRS' ? 'default' : 'outline'}
                                                                onClick={() => {
                                                                    setResolutions(prev => ({
                                                                        ...prev,
                                                                        [diff.path]: {
                                                                            ...prev[diff.path],
                                                                            resolution: 'TAKE_THEIRS',
                                                                            resolvedBlob: diff.theirsBlob ?? null
                                                                        }
                                                                    }));
                                                                    setSelectedViewModes(prev => ({ ...prev, [diff.path]: 'resolved' }));
                                                                }}
                                                                className="cursor-pointer transition-all active:scale-[0.98]"
                                                            >
                                                                Take Theirs (Workspace HEAD)
                                                            </Button>
                                                            
                                                            <div className="relative">
                                                                <input
                                                                    type="file"
                                                                    id={`file-upload-${diff.path}`}
                                                                    className="hidden"
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file && resolutions[diff.path]) {
                                                                            handleFileUpload(diff.path, resolutions[diff.path].conflictId, file);
                                                                        }
                                                                    }}
                                                                />
                                                                <Button
                                                                    size="sm"
                                                                    variant={resolutions[diff.path]?.resolution === 'MANUAL' ? 'default' : 'outline'}
                                                                    disabled={uploadingFiles[diff.path]}
                                                                    onClick={() => document.getElementById(`file-upload-${diff.path}`)?.click()}
                                                                    className="gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
                                                                >
                                                                    {uploadingFiles[diff.path] ? (
                                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                                    ) : (
                                                                        'Upload resolved file'
                                                                    )}
                                                                </Button>
                                                            </div>

                                                            {resolutions[diff.path]?.resolution && resolutions[diff.path]?.resolution !== 'PENDING' && (
                                                                <span className="text-xs font-semibold text-green-600 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded shadow-sm animate-in fade-in zoom-in-95 duration-200">
                                                                    Resolved: {resolutions[diff.path].resolution}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <PRFileContentViewer
                                                            repoId={repoId}
                                                            blobHash={
                                                                mode === 'base'
                                                                    ? diff.baseBlob
                                                                    : mode === 'ours'
                                                                    ? diff.oursBlob
                                                                    : mode === 'theirs'
                                                                    ? diff.theirsBlob
                                                                    : resolutions[diff.path]?.resolvedBlob
                                                            }
                                                            label={
                                                                mode === 'base'
                                                                    ? 'Base Version'
                                                                    : mode === 'ours'
                                                                    ? 'Ours (Repo HEAD)'
                                                                    : mode === 'theirs'
                                                                    ? 'Theirs (Workspace HEAD)'
                                                                    : 'Resolved Version'
                                                            }
                                                            filePath={diff.path}
                                                        />
                                                    </div>
                                                ) : (
                                                    <PRFileContentViewer
                                                        repoId={repoId}
                                                        blobHash={mode === 'old' ? diff.oldBlobHash : diff.newBlobHash}
                                                        label={mode === 'old' ? 'Old File' : 'Updated File'}
                                                        filePath={diff.path}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </section>

                </div>
            </div>

            {/* Right Sidebar - Review Status & Add Reviewers */}
            <div className="w-80 border-l bg-card/40 flex flex-col h-full shrink-0 overflow-y-auto p-6 space-y-6 no-scrollbar">
                {/* Review Status Section */}
                <div className="space-y-4">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Review Status</h4>
                    {isLoadingReviews ? (
                        <div className="py-4 text-center text-xs text-muted-foreground flex justify-center items-center">
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Loading...
                        </div>
                    ) : reviewsError ? (
                        <div className="text-xs text-destructive">{reviewsError}</div>
                    ) : reviews.length === 0 ? (
                        <div className="text-xs text-muted-foreground italic">No reviewers assigned.</div>
                    ) : (
                        <div className="space-y-3">
                            {reviews.map((r) => (
                                <div key={r.id} className="border border-border bg-card rounded-lg p-3 space-y-2 text-xs shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6">
                                                <AvatarFallback className="text-[10px] font-bold bg-muted">
                                                    {r.reviewer?.displayName?.slice(0, 2).toUpperCase() || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-semibold text-foreground">{r.reviewer?.displayName || 'Unknown'}</span>
                                        </div>
                                        
                                        {/* Verdict badge */}
                                        {r.verdict === 'APPROVED' ? (
                                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-green-500 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                                                <CheckCircle2 className="h-3 w-3" /> Approved
                                            </span>
                                        ) : r.verdict === 'CHANGES_REQUESTED' ? (
                                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
                                                <XCircle className="h-3 w-3" /> Changes Requested
                                            </span>
                                        ) : r.verdict === 'PR_CLOSED' ? (
                                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-muted-foreground bg-muted border px-2 py-0.5 rounded-full">
                                                PR Closed
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                                                <HelpCircle className="h-3 w-3" /> Pending
                                            </span>
                                        )}
                                    </div>
                                    {r.body && (
                                        <div className="bg-muted/40 p-2 rounded text-muted-foreground italic break-words border border-border/40">
                                            "{r.body}"
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Add Reviewers Section */}
                <div className="space-y-4 pt-4 border-t border-border">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Add Reviewers</h4>
                    
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                        <Input
                            placeholder="Search repo members..."
                            value={reviewerSearch}
                            onChange={(e) => setReviewerSearch(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                            className="pl-8 h-8 text-xs w-full text-foreground bg-background"
                        />
                        
                        {isSearchFocused && availableSearchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg max-h-40 overflow-y-auto z-50">
                                {availableSearchResults.map((user) => (
                                    <button
                                        key={user.id}
                                        onMouseDown={() => handleSelectReviewer(user)}
                                        className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors flex items-center justify-between text-foreground"
                                    >
                                        <span>{user.displayName} ({user.username})</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Display selected reviewers queue */}
                    {selectedReviewers.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex flex-wrap gap-1">
                                {selectedReviewers.map((user) => (
                                    <span key={user.id} className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground text-[10px] font-semibold pl-2 pr-1 py-0.5 rounded-full border">
                                        {user.displayName}
                                        <button
                                            onClick={() => setSelectedReviewers((prev) => prev.filter((u) => u.id !== user.id))}
                                            className="hover:bg-muted rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="h-2.5 w-2.5" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            
                            <Button
                                size="sm"
                                onClick={handleAddReviewers}
                                disabled={isAddingReviewers}
                                className="w-full h-8 text-xs font-semibold"
                            >
                                {isAddingReviewers && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
                                Assign Reviewers
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Close PR Confirmation Modal */}
            <Dialog open={showCloseModal} onOpenChange={setShowCloseModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-5 w-5" /> Close Pull Request
                        </DialogTitle>
                        <DialogDescription className="pt-2 text-foreground/80">
                            Are you sure you want to close this pull request? Once closed, further code updates or merges cannot be applied directly.
                        </DialogDescription>
                    </DialogHeader>

                    {closeModalError && (
                        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
                            {closeModalError}
                        </div>
                    )}

                    <DialogFooter className="pt-4 gap-2 sm:gap-0">
                        <Button
                            variant="ghost"
                            onClick={() => setShowCloseModal(false)}
                            disabled={isClosingPR}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmClosePR}
                            disabled={isClosingPR}
                            className="gap-2"
                        >
                            {isClosingPR && <Loader2 className="h-4 w-4 animate-spin" />}
                            Yes, Close Pull Request
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function PRFileContentViewer({ repoId, blobHash, label, filePath }: { repoId: string; blobHash: string | null | undefined; label: string; filePath: string }) {
    const { url, isLoading, error } = useBlobContent(repoId, blobHash);

    if (!blobHash) {
        return (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-md bg-muted/10 text-muted-foreground text-sm">
                <span>{label}: No content available for this state.</span>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center gap-2 py-12 border rounded-md bg-muted/10 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading content from Cloudinary…
            </div>
        );
    }

    if (error || !url) {
        return (
            <div className="py-12 text-center text-sm text-destructive border rounded-md bg-destructive/5">
                {error ?? 'Failed to load Cloudinary content for this blob'}
            </div>
        );
    }

    return (
        <SafeFileContentRenderer url={url} filePath={filePath} />
    );
}
