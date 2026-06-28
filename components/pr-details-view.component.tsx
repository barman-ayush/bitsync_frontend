'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, GitCommit, FileText, User, Calendar, GitPullRequest, MessageSquare, Loader2, Trash2 } from 'lucide-react';
import { usePRDetails, PRComment } from '@/hooks/use-pr-details';
import { usePRCommits } from '@/hooks/use-pr-commits';
import { usePRDiffs } from '@/hooks/use-pr-diffs';

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
    
    const diffRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
    const [selectedViewModes, setSelectedViewModes] = useState<{ [key: string]: 'old' | 'new' }>({});
    const [generalDraft, setGeneralDraft] = useState('');
    const [showGeneralCommentInput, setShowGeneralCommentInput] = useState(false);
    const [commentsList, setCommentsList] = useState<PRComment[]>([]);
    const [isPostingComment, setIsPostingComment] = useState(false);
    const [isDeletingComment, setIsDeletingComment] = useState<{ [key: string]: boolean }>({});

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
                alert(json?.message ?? 'Failed to add comment');
            }
        } catch (err: any) {
            alert(err.message ?? 'Network error');
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
                alert(json?.message ?? 'Failed to delete comment');
            }
        } catch (err: any) {
            alert(err.message ?? 'Network error');
        } finally {
            setIsDeletingComment(prev => ({ ...prev, [commentId]: false }));
        }
    };

    const scrollToDiff = (diffId: string) => {
        const el = diffRefs.current[diffId];
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const toggleViewMode = (diffId: string, mode: 'old' | 'new') => {
        setSelectedViewModes((prev) => ({ ...prev, [diffId]: mode }));
    };

    const { commits, isLoading: isLoadingCommits, error: commitsError } = usePRCommits(repoId, fetchedPr?.workspaceId);
    const { diffs, isLoading: isLoadingDiffs, error: diffsError } = usePRDiffs(repoId, prId);

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
                <div className="flex-1 overflow-y-auto p-2">
                    {isLoadingDiffs ? (
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
                            <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ml-2 shrink-0 ${
                                diff.changeType === 'ADD' ? 'bg-green-500/10 text-green-500' :
                                diff.changeType === 'DELETE' ? 'bg-red-500/10 text-red-500' :
                                diff.changeType === 'RENAME' ? 'bg-purple-500/10 text-purple-500' :
                                'bg-blue-500/10 text-blue-500'
                            }`}>
                                {diff.changeType}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 scroll-smooth">
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
                                        {pr.title} <span className="text-muted-foreground font-normal">#{prId.slice(0,6)}</span>
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
                            <div className="flex items-center gap-2 shrink-0">
                                <Button className="bg-green-600 hover:bg-green-700 text-white">
                                    Merge PR
                                </Button>
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

                    {/* Section 3: Diff Files */}
                    <section>
                        <h2 className="text-lg font-semibold mb-4 border-b pb-2">Changed Files</h2>
                        <div className="space-y-6">
                            {isLoadingDiffs ? (
                                <div className="py-8 text-center text-sm text-muted-foreground flex justify-center items-center">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Loading file diffs...
                                </div>
                            ) : diffsError ? (
                                <div className="py-8 text-center text-sm text-destructive">
                                    {diffsError}
                                </div>
                            ) : diffs.length === 0 ? (
                                <div className="py-8 text-center text-sm text-muted-foreground">
                                    No file changes found.
                                </div>
                            ) : (
                                diffs.map((diff) => {
                                    const mode = selectedViewModes[diff.path] || 'new';
                                    return (
                                        <div 
                                            key={diff.path} 
                                            id={diff.path}
                                            ref={(el) => {
                                                if (el) diffRefs.current[diff.path] = el;
                                            }}
                                            className="border rounded-lg bg-card overflow-hidden scroll-mt-6"
                                        >
                                            <div className="flex items-center justify-between bg-muted/40 px-4 py-2 border-b">
                                                <div className="font-mono text-sm font-medium flex items-center gap-2">
                                                    <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                                                        diff.changeType === 'ADD' ? 'bg-green-500/10 text-green-500' :
                                                        diff.changeType === 'DELETE' ? 'bg-red-500/10 text-red-500' :
                                                        diff.changeType === 'RENAME' ? 'bg-purple-500/10 text-purple-500' :
                                                        'bg-blue-500/10 text-blue-500'
                                                    }`}>
                                                        {diff.changeType}
                                                    </span>
                                                    {diff.changeType === 'RENAME' ? (
                                                        <span>{diff.oldPath} &rarr; {diff.path}</span>
                                                    ) : (
                                                        <span>{diff.path}</span>
                                                    )}
                                                </div>
                                                <div className="flex bg-muted rounded-md p-0.5">
                                                    <button
                                                        onClick={() => toggleViewMode(diff.path, 'old')}
                                                        className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${mode === 'old' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                                    >
                                                        Old File
                                                    </button>
                                                    <button
                                                        onClick={() => toggleViewMode(diff.path, 'new')}
                                                        className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${mode === 'new' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                                    >
                                                        Updated File
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-background">
                                                <div className="flex items-center justify-center py-12 border-2 border-dashed border-muted rounded-md bg-muted/10">
                                                    <p className="text-sm text-muted-foreground">
                                                        {mode === 'old' ? 'Old file content mockup' : 'Updated file content mockup'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}
