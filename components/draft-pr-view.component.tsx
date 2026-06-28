'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, GitCommit, FileText, GitPullRequest, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { usePRCommits } from '@/hooks/use-pr-commits';
import { useMergeCheck } from '@/hooks/use-merge-check';
import { useBlobContent } from '@/hooks/use-blob-content';

interface DraftPrViewProps {
    repoId: string;
    workspaceId?: string;
    onBack: () => void;
    onPRCreated: (prId: string) => void;
}

export function DraftPrView({ repoId, workspaceId, onBack, onPRCreated }: DraftPrViewProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedViewModes, setSelectedViewModes] = useState<{ [key: string]: 'old' | 'new' }>({});
    const diffRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    const { commits, isLoading: isLoadingCommits, error: commitsError } = usePRCommits(repoId, workspaceId);
    const { data: mergeCheckData, isLoading: isLoadingMergeCheck, error: mergeCheckError } = useMergeCheck(repoId, workspaceId);

    const diffs: { 
        path: string; 
        isConflict: boolean; 
        conflictType?: string; 
        changeType: string;
        oldBlobHash?: string | null; 
        newBlobHash?: string | null;
        baseBlob?: string | null;
        oursBlob?: string | null;
        theirsBlob?: string | null;
    }[] = [];

    if (mergeCheckData) {
        if (mergeCheckData.conflicts) {
            mergeCheckData.conflicts.forEach(c => {
                diffs.push({
                    path: c.filePath,
                    isConflict: true,
                    conflictType: c.conflictType,
                    changeType: 'CONFLICT',
                    baseBlob: c.baseBlob,
                    oursBlob: c.oursBlob,
                    theirsBlob: c.theirsBlob,
                });
            });
        }
        if (mergeCheckData.mergedPaths) {
            Object.entries(mergeCheckData.mergedPaths).forEach(([p, entry]) => {
                if (!diffs.some(d => d.path === p)) {
                    diffs.push({
                        path: p,
                        isConflict: false,
                        changeType: entry.oldBlobHash === null ? 'ADD' : 'MODIFY',
                        oldBlobHash: entry.oldBlobHash,
                        newBlobHash: entry.newBlobHash,
                    });
                }
            });
        }
    }

    const canCreatePr = title.trim().length > 0 && mergeCheckData?.canMerge === true && !isSubmitting;

    const scrollToDiff = (diffId: string) => {
        const el = diffRefs.current[diffId];
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const toggleViewMode = (diffId: string, mode: 'old' | 'new') => {
        setSelectedViewModes((prev) => ({ ...prev, [diffId]: mode }));
    };

    const handleCreatePr = async () => {
        if (!title.trim()) {
            alert('Pull request title is required.');
            return;
        }
        if (!repoId || !workspaceId) {
            alert('Missing repository or workspace context.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/pr/create/${encodeURIComponent(repoId)}/${encodeURIComponent(workspaceId)}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: title.trim(), description: description.trim() }),
                    credentials: 'include',
                }
            );

            const json = await res.json().catch(() => null);
            if (res.ok && json?.data?.id) {
                onPRCreated(json.data.id);
            } else {
                alert(json?.message ?? 'Failed to create pull request.');
            }
        } catch (err: any) {
            alert(err.message ?? 'Network error');
        } finally {
            setIsSubmitting(false);
        }
    };

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
                    {diffs.map((diff) => (
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
                                diff.isConflict ? 'bg-red-500/10 text-red-500' :
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
            <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 scroll-smooth">
                <div className="max-w-4xl w-full mx-auto space-y-10 pb-20">
                    
                    {/* Top Header & Action */}
                    <div className="flex items-center justify-between gap-4 border-b pb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                                <GitPullRequest className="h-6 w-6 text-blue-500" />
                                Open a Pull Request
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Create a pull request to merge changes from your workspace into upstream.
                            </p>
                        </div>
                        <Button 
                            onClick={handleCreatePr} 
                            disabled={!canCreatePr} 
                            title={!title.trim() ? "Title is required" : mergeCheckData && !mergeCheckData.canMerge ? "Cannot create PR with conflicts" : "Create Pull Request"}
                            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white gap-2 shrink-0"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <GitPullRequest className="h-4 w-4" />
                                    Create Pull Request
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Section 1: PR Details (Title & Description) */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold border-b pb-2">PR Details</h2>
                        <div className="bg-card border rounded-lg p-4 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground">
                                    Title <span className="text-destructive">*</span>
                                </label>
                                <Input 
                                    value={title} 
                                    onChange={(e) => setTitle(e.target.value)} 
                                    placeholder="e.g. Add user authentication feature"
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground">Description</label>
                                <Textarea 
                                    value={description} 
                                    onChange={(e) => setDescription(e.target.value)} 
                                    placeholder="Describe your changes and context..."
                                    className="min-h-[120px] resize-none"
                                    disabled={isSubmitting}
                                />
                            </div>
                            {mergeCheckData && (
                                <div className={`p-4 rounded-lg border flex items-center justify-between text-sm ${
                                mergeCheckData.canMerge 
                                    ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400' 
                                    : 'bg-destructive/10 border-destructive/20 text-destructive'
                            }`}>
                                <div className="flex items-center gap-2 font-medium">
                                    {mergeCheckData.canMerge ? (
                                        <>
                                            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                                            <span>Able to merge automatically. No conflicts detected.</span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
                                            <span>Cannot merge automatically due to {mergeCheckData.stats.conflictCount} conflict(s).</span>
                                        </>
                                    )}
                                </div>
                                <div className="text-xs font-mono opacity-80">
                                    {mergeCheckData.stats.cleanFiles} clean / {mergeCheckData.stats.totalFiles} total files
                                </div>
                            </div>
                        )}
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
                                    No commits found in workspace.
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

                    {/* Section 3: Changed Files */}
                    <section>
                        <h2 className="text-lg font-semibold mb-4 border-b pb-2">Changed Files</h2>
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
                                                        diff.isConflict ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                                                    }`}>
                                                        {diff.isConflict ? `CONFLICT (${diff.conflictType})` : 'MERGED'}
                                                    </span>
                                                    <span>{diff.path}</span>
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
                                                {diff.isConflict ? (
                                                    <div className="space-y-3">
                                                        <div className="text-xs font-mono text-muted-foreground bg-destructive/10 border border-destructive/20 p-2 rounded-md flex items-center justify-between">
                                                            <span className="font-semibold text-destructive">Conflict Type: {diff.conflictType}</span>
                                                            <span>Base: {diff.baseBlob?.slice(0, 8) ?? 'none'} | Ours: {diff.oursBlob?.slice(0, 8) ?? 'none'} | Theirs: {diff.theirsBlob?.slice(0, 8) ?? 'none'}</span>
                                                        </div>
                                                        <DraftFileContentViewer 
                                                            repoId={repoId} 
                                                            blobHash={mode === 'old' ? diff.oursBlob : diff.theirsBlob} 
                                                            label={mode === 'old' ? 'Ours (Repo HEAD)' : 'Theirs (Workspace HEAD)'} 
                                                        />
                                                    </div>
                                                ) : (
                                                    <DraftFileContentViewer 
                                                        repoId={repoId} 
                                                        blobHash={mode === 'old' ? diff.oldBlobHash : diff.newBlobHash} 
                                                        label={mode === 'old' ? 'Old File (Repo HEAD)' : 'Updated File (Auto-merged)'} 
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
        </div>
    );
}

function DraftFileContentViewer({ repoId, blobHash, label }: { repoId: string; blobHash: string | null | undefined; label: string }) {
    const { url, isLoading, error } = useBlobContent(repoId, blobHash);

    if (!blobHash) {
        return (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-md bg-muted/10 text-muted-foreground text-sm">
                <span>{label}: No content available (File did not exist in this state).</span>
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
        <div className="relative w-full h-[400px] border rounded-md overflow-hidden bg-background">
            <iframe
                src={url}
                className="w-full h-full border-0"
                title={label}
                sandbox="allow-same-origin allow-scripts"
            />
        </div>
    );
}
