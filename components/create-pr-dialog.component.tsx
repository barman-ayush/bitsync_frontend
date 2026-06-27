'use client';

import { useEffect, useState } from 'react';
import { GitPullRequest, GitCommit as GitCommitIcon } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CreatePrDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    repoId?: string;
    workspaceId?: string;
    workspaceLabel?: string;
    isCreating?: boolean;
    onCreate?: (title: string, description: string) => Promise<unknown>;
}

interface CommitTrailEntry {
    message: string;
    commitHash: string;
    timestamp: string;
}

export function CreatePrDialog({
    open,
    onOpenChange,
    repoId,
    workspaceId,
    workspaceLabel,
    isCreating = false,
    onCreate,
}: CreatePrDialogProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [commits, setCommits] = useState<CommitTrailEntry[]>([]);
    const [isLoadingCommits, setIsLoadingCommits] = useState(false);
    const [commitsError, setCommitsError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setTitle('');
            setDescription('');
        }
    }, [open]);

    useEffect(() => {
        if (!open || !repoId || !workspaceId) return;

        const controller = new AbortController();
        setIsLoadingCommits(true);
        setCommitsError(null);

        (async () => {
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/pr/commit-trail/${encodeURIComponent(
                        repoId,
                    )}/${encodeURIComponent(workspaceId)}`,
                    { credentials: 'include', signal: controller.signal },
                );
                const body = await res.json().catch(() => null);
                if (controller.signal.aborted) return;

                if (!res.ok || !Array.isArray(body?.data)) {
                    setCommitsError(body?.message ?? `Request failed with ${res.status}`);
                    return;
                }

                setCommits(body.data);
            } catch (e) {
                if (controller.signal.aborted || (e as Error).name === 'AbortError') {
                    return;
                }
                setCommitsError((e as Error).message ?? 'Network error');
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoadingCommits(false);
                }
            }
        })();

        return () => controller.abort();
    }, [open, repoId, workspaceId]);

    const isValid = title.trim().length > 0;

    const handleCreate = async () => {
        if (!isValid || isCreating || !onCreate) return;
        const result = await onCreate(title.trim(), description.trim());
        if (result) onOpenChange(false);
    };

    // The oldest commit should be lowermost
    const sortedCommits = [...commits].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (isCreating) return;
                onOpenChange(next);
            }}
        >
            <DialogContent className="sm:max-w-[85vh] w-full h-[85vh] max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Create Pull Request</DialogTitle>
                    <DialogDescription>
                        Open a pull request for the commits in{' '}
                        <span className="font-mono">{workspaceLabel ?? 'this workspace'}</span>.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 flex-1 overflow-hidden min-h-0">
                    {/* Left Column: Form */}
                    <div className="relative min-h-0 h-full">
                        <ScrollArea className="absolute inset-0 pr-4">
                            <div className="space-y-4 flex flex-col min-h-full pb-4">
                                <div className="space-y-2">
                                    <label
                                        htmlFor="pr-title"
                                        className="text-sm font-semibold text-foreground"
                                    >
                                        Title <span className="text-destructive">*</span>
                                    </label>
                                    <Input
                                        id="pr-title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        disabled={isCreating}
                                        autoFocus
                                        placeholder="Pull request title"
                                    />
                                </div>
                                <div className="space-y-2 flex flex-col flex-1 min-h-[200px]">
                                    <label
                                        htmlFor="pr-description"
                                        className="text-sm font-semibold text-foreground"
                                    >
                                        Description
                                    </label>
                                    <Textarea
                                        id="pr-description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        disabled={isCreating}
                                        placeholder="Add a description for your pull request..."
                                        className="resize-none flex-1 min-h-[200px]"
                                    />
                                </div>
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Right Column: Commit Trail */}
                    <div className="space-y-2 flex flex-col overflow-hidden min-h-0 h-full">
                        <label className="text-sm font-semibold text-foreground shrink-0">
                            Commit Trail
                        </label>
                        <div className="flex-1 rounded-md border bg-muted/20 overflow-hidden relative min-h-0">
                            <ScrollArea className="absolute inset-0">
                                <div className="p-4 space-y-4">
                                    {isLoadingCommits ? (
                                        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                                            <Spinner className="mr-2 h-4 w-4" />
                                            Loading commits...
                                        </div>
                                    ) : commitsError ? (
                                        <div className="py-8 text-center text-sm text-destructive">
                                            {commitsError}
                                        </div>
                                    ) : sortedCommits.length === 0 ? (
                                        <div className="py-8 text-center text-sm text-muted-foreground">
                                            No commits found.
                                        </div>
                                    ) : (
                                        sortedCommits.map((commit, index) => (
                                            <div key={commit.commitHash} className="relative pl-6">
                                                {/* Timeline line */}
                                                {index !== sortedCommits.length - 1 && (
                                                    <div className="absolute left-[7px] top-6 bottom-[-24px] w-px bg-border" />
                                                )}
                                                {/* Timeline dot */}
                                                <div className="absolute left-[3px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-primary bg-background" />

                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-medium text-foreground truncate" title={commit.message}>
                                                        {commit.message}
                                                    </span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
                                                            <GitCommitIcon className="h-3 w-3 shrink-0" />
                                                            {commit.commitHash.length > 8 ? `${commit.commitHash.slice(0, 8)}...` : commit.commitHash}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground shrink-0">
                                                            {new Date(commit.timestamp).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                </div>

                <DialogFooter className="pt-2">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={isCreating}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleCreate}
                        disabled={!isValid || isCreating}
                        className="gap-1.5 hover:bg-primary hover:opacity-90"
                    >
                        {isCreating ? (
                            <>
                                <Spinner className="h-3.5 w-3.5" />
                                Creating…
                            </>
                        ) : (
                            <>
                                <GitPullRequest className="h-4 w-4" />
                                Create PR
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
